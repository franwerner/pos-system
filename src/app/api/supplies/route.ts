import { z } from "zod"
import {
    SUPPLY_ORIGINS,
    SUPPLY_TYPES,
    SUPPLY_UNITS,
    type Supply,
    type SupplyWithCost,
} from "@/features/supplies/types/supply.type"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"
import buildSearchTerm from "@/shared/utils/buildSearchTerm.util"
import { fetchLastProductionCosts } from "../production/load-production-components"

export const runtime = "nodejs"

const componentSchema = z.object({
    supply_id: z.number().int().positive(),
    quantity: z.number().positive("La cantidad del componente debe ser mayor a 0"),
})

const createSupplySchema = z.object({
    name: z.string().trim().min(1, "El nombre es obligatorio"),
    type: z.enum(SUPPLY_TYPES),
    origin: z.enum(SUPPLY_ORIGINS),
    unit: z.enum(SUPPLY_UNITS),
    purchase_price: z.number().min(0, "El precio de compra debe ser mayor o igual a 0"),
    yield_factor: z.number().positive("El rendimiento debe ser mayor a 0"),
    min_stock: z.number().min(0, "El stock mínimo debe ser mayor o igual a 0"),
    components: z.array(componentSchema).optional(),
})

export const GET = authenticatedRoute({}, async ({ request }): Promise<SupplyWithCost[]> => {
    const params = request.nextUrl.searchParams
    const search = params.get("search")?.trim()
    const type = params.get("type")
    const origin = params.get("origin")
    // Un preparado sin composición no consume nada al producirse: no hay costo que
    // calcular ni componentes que descontar, así que no se ofrece para producir.
    const onlyProducible = params.get("onlyProducible") === "true"

    const query = getServerSupabase()
        .from("supply")
        .select("*, supply_component!supply_component_parent_supply_id_fkey(id)")
        .order("name")

    if (type && type !== "all") query.eq("type", type)
    if (origin) query.eq("origin", origin)
    if (params.get("onlyActive") === "true") query.eq("is_active", true)
    if (search) query.ilike("search_name", `%${buildSearchTerm(search)}%`)

    const { data, error } = await query

    if (error) throw new Error(error.message)

    const supplies = (data ?? [])
        .filter((supply) => !onlyProducible || supply.supply_component.length > 0)
        .map(({ supply_component, ...supply }) => supply as Supply)

    const lastCosts = await fetchLastProductionCosts(
        supplies.filter((supply) => supply.origin === "produced").map((supply) => supply.id),
    )

    return supplies.map((supply) => ({
        ...supply,
        last_production_unit_cost: lastCosts.get(supply.id) ?? null,
    }))
})

export const POST = authenticatedRoute({ body: createSupplySchema }, async ({ body }) => {
    const { components, ...values } = body
    const supabase = getServerSupabase()

    const { data: supply, error } = await supabase
        .from("supply")
        .insert(values)
        .select("*")
        .single()

    if (error) throw new Error(error.message)

    if (components && components.length > 0) {
        const { error: componentsError } = await supabase
            .from("supply_component")
            .insert(components.map((line) => ({
                parent_supply_id: supply.id,
                component_supply_id: line.supply_id,
                quantity: line.quantity,
            })))

        // PostgREST no abarca las dos inserciones en una transacción: sin este
        // borrado queda un preparado sin la composición que lo define.
        if (componentsError) {
            await supabase.from("supply").delete().eq("id", supply.id)
            throw new ApiError(400, "No se pudo guardar la composición del preparado")
        }
    }

    return supply as Supply
})
