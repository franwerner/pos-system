import { createClient } from "@supabase/supabase-js"
import type { Database } from "../src/shared/types/database.types"

const requireEnv = (name: string): string => {
    const value = process.env[name]

    if (!value) throw new Error(`Falta ${name} en .env.local`)

    return value
}

const supabase = createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
)

const unwrap = <T>({ data, error }: { data: T | null; error: { message: string } | null }): NonNullable<T> => {
    if (error) throw new Error(error.message)
    if (data === null || data === undefined) throw new Error("La operación no devolvió datos")

    return data as NonNullable<T>
}

// El orden respeta las claves foráneas: lo que referencia se borra antes que lo referenciado.
const TABLES_TO_CLEAR = [
    "sale_payment",
    "sale_item",
    "stock_movement",
    "sale",
    "cash_session",
    "purchase_item",
    "purchase",
    "production",
    "product_supply",
    "supply_component",
    "product",
    "category",
    "supply",
    "fixed_cost",
    "tax",
] as const

const clear = async () => {
    for (const table of TABLES_TO_CLEAR) {
        const { error } = await supabase.from(table).delete().gte("id", 0)

        if (error) throw new Error(`No se pudo limpiar ${table}: ${error.message}`)
    }

    // app_config y payment_method se actualizan en vez de borrarse: la config es un
    // singleton (una sola fila) y los métodos de pago los referencian las ventas ya cobradas.
    const { error } = await supabase.from("payment_method").delete().gte("id", 0)

    if (error) throw new Error(`No se pudo limpiar payment_method: ${error.message}`)
}

const seedPaymentMethods = async () =>
    unwrap(
        await supabase
            .from("payment_method")
            // El precio publicado ya incluye el costo de cobrar con tarjeta, así que las
            // tarjetas van en 0 y lo que se ofrece es descuento por efectivo: en Argentina
            // no se puede cobrar más caro por pagar con tarjeta. Las cuotas sí recargan:
            // es financiación que el cliente elige aparte.
            //
            // `expected_share` es la mezcla declarada de medios de pago: con cuánto de
            // las ventas espera cobrar el negocio en cada uno. Suma 100 y es lo que
            // pondera las comisiones en el costeo.
            .insert([
                { name: "Efectivo", tax: -10, expected_share: 40 },
                { name: "Débito", tax: 0, expected_share: 20 },
                { name: "Crédito", tax: 0, expected_share: 30 },
                { name: "Transferencia", tax: 0, expected_share: 10 },
                { name: "Crédito 3 cuotas", tax: 18, expected_share: 0 },
            ])
            .select("id, name"),
    )

const seedCategories = async () => {
    const parents = unwrap(
        await supabase
            .from("category")
            .insert([{ name: "Comidas" }, { name: "Bebidas" }, { name: "Postres" }])
            .select("id, name"),
    )

    const byName = (name: string) => parents.find((c) => c.name === name)!.id

    const children = unwrap(
        await supabase
            .from("category")
            .insert([
                { name: "Hamburguesas", parent_id: byName("Comidas") },
                { name: "Milanesas", parent_id: byName("Comidas") },
                { name: "Gaseosas", parent_id: byName("Bebidas") },
            ])
            .select("id, name"),
    )

    return { parents, children }
}

const seedSupplies = async () =>
    unwrap(
        await supabase
            .from("supply")
            .insert([
                { name: "Carne picada", type: "food", unit: "gr", origin: "purchased", purchase_price: 10.5, yield_factor: 0.85, min_stock: 2000 },
                { name: "Pan de hamburguesa", type: "food", unit: "u", origin: "purchased", purchase_price: 350, yield_factor: 1, min_stock: 20 },
                { name: "Queso cheddar", type: "food", unit: "gr", origin: "purchased", purchase_price: 8.9, yield_factor: 1, min_stock: 500 },
                { name: "Papa", type: "food", unit: "gr", origin: "purchased", purchase_price: 1.2, yield_factor: 0.75, min_stock: 5000 },
                { name: "Pan rallado", type: "food", unit: "gr", origin: "purchased", purchase_price: 2.4, yield_factor: 1, min_stock: 1000 },
                { name: "Huevo", type: "food", unit: "u", origin: "purchased", purchase_price: 180, yield_factor: 1, min_stock: 24 },
                { name: "Harina", type: "food", unit: "gr", origin: "purchased", purchase_price: 1.1, yield_factor: 1, min_stock: 2000 },
                { name: "Azúcar", type: "food", unit: "gr", origin: "purchased", purchase_price: 1.6, yield_factor: 1, min_stock: 1000 },
                { name: "Coca-Cola lata 354ml", type: "drink", unit: "u", origin: "purchased", purchase_price: 950, yield_factor: 1, min_stock: 12 },
                { name: "Agua mineral 500ml", type: "drink", unit: "u", origin: "purchased", purchase_price: 520, yield_factor: 1, min_stock: 12 },
                { name: "Bandeja de cartón", type: "packaging", unit: "u", origin: "purchased", purchase_price: 120, yield_factor: 1, min_stock: 50 },
                { name: "Servilleta", type: "packaging", unit: "u", origin: "purchased", purchase_price: 15, yield_factor: 1, min_stock: 200 },
                { name: "Milanesa cruda", type: "food", unit: "u", origin: "produced", purchase_price: 0, yield_factor: 1, min_stock: 10 },
            ])
            .select("id, name"),
    )

const main = async () => {
    console.log("Limpiando datos anteriores…")
    await clear()

    console.log("Métodos de pago…")
    const paymentMethods = await seedPaymentMethods()
    const cash = paymentMethods.find((p) => p.name === "Efectivo")!

    console.log("Categorías…")
    const { parents, children } = await seedCategories()
    const categories = [...parents, ...children]
    const categoryId = (name: string) => categories.find((c) => c.name === name)!.id

    console.log("Insumos…")
    const supplies = await seedSupplies()
    const supplyId = (name: string) => supplies.find((s) => s.name === name)!.id

    console.log("Composición del preparado…")
    const { error: componentError } = await supabase.from("supply_component").insert([
        { parent_supply_id: supplyId("Milanesa cruda"), component_supply_id: supplyId("Carne picada"), quantity: 120 },
        { parent_supply_id: supplyId("Milanesa cruda"), component_supply_id: supplyId("Pan rallado"), quantity: 40 },
        { parent_supply_id: supplyId("Milanesa cruda"), component_supply_id: supplyId("Huevo"), quantity: 0.25 },
    ])

    if (componentError) throw new Error(componentError.message)

    console.log("Productos…")
    const products = unwrap(
        await supabase
            .from("product")
            .insert([
                { name: "Hamburguesa clásica", description: "Carne, queso y pan casero", price: 6500, category_id: categoryId("Hamburguesas"), target_margin_percentage: 65 },
                { name: "Hamburguesa doble", description: "Doble carne y doble queso", price: 8900, category_id: categoryId("Hamburguesas") },
                { name: "Milanesa con papas", description: "Milanesa de ternera con guarnición", price: 9500, category_id: categoryId("Milanesas") },
                { name: "Porción de papas fritas", description: "Papas de la casa", price: 3800, category_id: categoryId("Comidas") },
                // Las bebidas se venden con un margen mucho más alto que la comida: cada
                // producto lleva el suyo, y el que no lo carga se queda sin precio sugerido.
                { name: "Coca-Cola lata", description: "354 ml bien fría", price: 2500, category_id: categoryId("Gaseosas"), target_margin_percentage: 75 },
                { name: "Agua mineral", description: "500 ml sin gas", price: 1800, category_id: categoryId("Gaseosas"), target_margin_percentage: 75 },
                { name: "Café", description: "Sin control de stock", price: 1500 },
            ])
            .select("id, name"),
    )

    const productId = (name: string) => products.find((p) => p.name === name)!.id

    console.log("Composición de los productos…")
    const { error: compositionError } = await supabase.from("product_supply").insert([
        { product_id: productId("Hamburguesa clásica"), supply_id: supplyId("Carne picada"), quantity: 150 },
        { product_id: productId("Hamburguesa clásica"), supply_id: supplyId("Pan de hamburguesa"), quantity: 1 },
        { product_id: productId("Hamburguesa clásica"), supply_id: supplyId("Queso cheddar"), quantity: 40 },
        { product_id: productId("Hamburguesa clásica"), supply_id: supplyId("Bandeja de cartón"), quantity: 1 },
        { product_id: productId("Hamburguesa clásica"), supply_id: supplyId("Servilleta"), quantity: 2 },

        { product_id: productId("Hamburguesa doble"), supply_id: supplyId("Carne picada"), quantity: 300 },
        { product_id: productId("Hamburguesa doble"), supply_id: supplyId("Pan de hamburguesa"), quantity: 1 },
        { product_id: productId("Hamburguesa doble"), supply_id: supplyId("Queso cheddar"), quantity: 80 },
        { product_id: productId("Hamburguesa doble"), supply_id: supplyId("Bandeja de cartón"), quantity: 1 },

        { product_id: productId("Milanesa con papas"), supply_id: supplyId("Milanesa cruda"), quantity: 1 },
        { product_id: productId("Milanesa con papas"), supply_id: supplyId("Papa"), quantity: 250 },
        { product_id: productId("Milanesa con papas"), supply_id: supplyId("Bandeja de cartón"), quantity: 1 },

        { product_id: productId("Porción de papas fritas"), supply_id: supplyId("Papa"), quantity: 300 },
        { product_id: productId("Porción de papas fritas"), supply_id: supplyId("Bandeja de cartón"), quantity: 1 },

        { product_id: productId("Coca-Cola lata"), supply_id: supplyId("Coca-Cola lata 354ml"), quantity: 1 },
        { product_id: productId("Agua mineral"), supply_id: supplyId("Agua mineral 500ml"), quantity: 1 },
    ])

    if (compositionError) throw new Error(compositionError.message)

    console.log("Compra inicial de mercadería…")
    const purchaseLines = [
        { name: "Carne picada", quantity: 20000, unit_price: 10.5 },
        { name: "Pan de hamburguesa", quantity: 100, unit_price: 350 },
        { name: "Queso cheddar", quantity: 3000, unit_price: 8.9 },
        { name: "Papa", quantity: 30000, unit_price: 1.2 },
        { name: "Pan rallado", quantity: 5000, unit_price: 2.4 },
        { name: "Huevo", quantity: 60, unit_price: 180 },
        { name: "Coca-Cola lata 354ml", quantity: 48, unit_price: 950 },
        { name: "Agua mineral 500ml", quantity: 48, unit_price: 520 },
        { name: "Bandeja de cartón", quantity: 200, unit_price: 120 },
        { name: "Servilleta", quantity: 1000, unit_price: 15 },
    ]

    const [purchase] = unwrap(
        await supabase
            .from("purchase")
            .insert({
                supplier_name: "Distribuidora del Centro",
                total: purchaseLines.reduce((acc, l) => acc + l.quantity * l.unit_price, 0),
                note: "Compra de arranque",
            })
            .select("id"),
    )

    const { error: purchaseItemError } = await supabase.from("purchase_item").insert(
        purchaseLines.map((l) => ({
            purchase_id: purchase.id,
            supply_id: supplyId(l.name),
            quantity: l.quantity,
            unit_price: l.unit_price,
        })),
    )

    if (purchaseItemError) throw new Error(purchaseItemError.message)

    const { error: purchaseMovementError } = await supabase.from("stock_movement").insert(
        purchaseLines.map((l) => ({
            supply_id: supplyId(l.name),
            type: "purchase" as const,
            quantity: l.quantity,
            unit_cost: l.unit_price,
            purchase_id: purchase.id,
        })),
    )

    if (purchaseMovementError) throw new Error(purchaseMovementError.message)

    console.log("Producción de milanesas…")
    const producedUnits = 20
    const componentCost =
        (10.5 / 0.85) * 120 + // carne
        2.4 * 40 + // pan rallado
        180 * 0.25 // huevo

    const [production] = unwrap(
        await supabase
            .from("production")
            .insert({
                supply_id: supplyId("Milanesa cruda"),
                quantity: producedUnits,
                unit_cost: Number(componentCost.toFixed(4)),
                note: "Tanda del día",
            })
            .select("id"),
    )

    const { error: productionMovementError } = await supabase.from("stock_movement").insert([
        { supply_id: supplyId("Carne picada"), type: "production_out", quantity: -120 * producedUnits, unit_cost: 10.5 / 0.85, production_id: production.id },
        { supply_id: supplyId("Pan rallado"), type: "production_out", quantity: -40 * producedUnits, unit_cost: 2.4, production_id: production.id },
        { supply_id: supplyId("Huevo"), type: "production_out", quantity: -0.25 * producedUnits, unit_cost: 180, production_id: production.id },
        { supply_id: supplyId("Milanesa cruda"), type: "production_in", quantity: producedUnits, unit_cost: Number(componentCost.toFixed(4)), production_id: production.id },
    ])

    if (productionMovementError) throw new Error(productionMovementError.message)

    console.log("Costos fijos del mes…")
    const period = new Date()
    const periodValue = `${period.getFullYear()}-${String(period.getMonth() + 1).padStart(2, "0")}-01`

    const { error: fixedCostError } = await supabase.from("fixed_cost").insert([
        { concept: "Alquiler", amount: 850000, period: periodValue },
        { concept: "Luz y gas", amount: 240000, period: periodValue },
        { concept: "Sueldos", amount: 1800000, period: periodValue },
        { concept: "Internet y teléfono", amount: 45000, period: periodValue },
    ])

    if (fixedCostError) throw new Error(fixedCostError.message)

    console.log("Configuración…")
    const configValues = {
        default_payment_id: cash.id,
        waste_percentage_food: 4,
        waste_percentage_drink: 1,
        waste_percentage_packaging: 0,
    }
    // Las migraciones crean la tabla pero no la fila: en una base recién creada no hay
    // nada que actualizar. El id es GENERATED ALWAYS, así que no se puede forzar id=1
    // con un upsert: se actualiza la fila que haya o se crea la primera.
    const { data: existingConfig, error: readConfigError } = await supabase
        .from("app_config")
        .select("id")
        .limit(1)
        .maybeSingle()

    if (readConfigError) throw new Error(readConfigError.message)

    const { error: configError } = existingConfig
        ? await supabase.from("app_config").update(configValues).eq("id", existingConfig.id)
        : await supabase.from("app_config").insert(configValues)

    if (configError) throw new Error(configError.message)

    console.log("Impuestos…")
    const credit = paymentMethods.find((p) => p.name === "Crédito")!

    const { error: taxError } = await supabase.from("tax").insert([
        { name: "Cuota de monotributo", type: "monthly_fixed", rate: 0, amount: 42000, payment_method_id: null },
        { name: "Comisión de tarjeta", type: "payment", rate: 3.5, amount: 0, payment_method_id: credit.id },
    ])

    if (taxError) throw new Error(taxError.message)

    console.log(
        `\nListo: ${paymentMethods.length} métodos de pago, ${products.length} productos, ${supplies.length} insumos, 1 compra, 1 producción, 4 costos fijos y 2 impuestos.`,
    )
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
})
