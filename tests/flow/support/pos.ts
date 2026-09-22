import { type PatchConfigInput } from "@/features/admin/hooks/usePatchConfig.hook"
import { type ConfigPos } from "@/features/admin/types/config.type"
import { type CashMovement, type CashMovementType } from "@/features/cash/types/cash-movement.type"
import { type CashSession, type CashSessionWithPayments } from "@/features/cash/types/cash-session.type"
import { type CostingReport } from "@/features/costing/types/costing.type"
import { type Order, type OrderStatus } from "@/features/order/types/sale.type"
import { type Payment } from "@/features/payment/types/payment.type"
import { type Product } from "@/features/products/types/product.type"
import { type StockMovement, type SupplyStock } from "@/features/stock/types/stock.type"
import { type Supply } from "@/features/supplies/types/supply.type"
import { type Tax, type TaxInput } from "@/features/taxes/types/tax.type"
import { type ApiClient } from "./api-client"

export type OrderLine = { product_id: number; quantity: number }
export type PaymentLine = { payment_method_id: number; amount: number }

export type StockByName = Map<string, number>

export const listSupplies = (client: ApiClient): Promise<Supply[]> => client.get<Supply[]>("/api/supplies")

export const listProducts = (client: ApiClient): Promise<Product[]> => client.get<Product[]>("/api/products")

export const listPaymentMethods = (client: ApiClient): Promise<Payment[]> =>
    client.get<Payment[]>("/api/payment-methods")

export const readConfig = (client: ApiClient): Promise<ConfigPos> => client.get<ConfigPos>("/api/config")

export const patchConfig = (
    client: ApiClient,
    values: PatchConfigInput,
): Promise<PatchConfigInput> => client.patch<PatchConfigInput>("/api/config", values)

/** Los parámetros de costeo tal como están guardados, para poder restaurarlos. */
export const readCostingParams = async (client: ApiClient): Promise<PatchConfigInput> => {
    const config = await readConfig(client)

    return {
        waste_percentage_food: config.waste_percentage_food,
        waste_percentage_drink: config.waste_percentage_drink,
        waste_percentage_packaging: config.waste_percentage_packaging,
    }
}

/** El margen objetivo vive en el producto: `null` lo deja sin precio sugerido. */
export const patchProductTargetMargin = (
    client: ApiClient,
    productId: number,
    targetMarginPercentage: number | null,
): Promise<unknown> => client.patch(`/api/products/${productId}`, {
    values: { target_margin_percentage: targetMarginPercentage },
})

export const listTaxes = (client: ApiClient): Promise<Tax[]> => client.get<Tax[]>("/api/taxes")

export const createTax = (
    client: ApiClient,
    input: Partial<TaxInput> & Pick<TaxInput, "name" | "type">,
): Promise<Tax> => client.post<Tax>("/api/taxes", input)

export const patchTax = (
    client: ApiClient,
    input: Partial<TaxInput> & { id: number },
): Promise<Tax> => client.patch<Tax>("/api/taxes", input)

export const deleteTax = (client: ApiClient, id: number): Promise<{ id: number }> =>
    client.delete<{ id: number }>("/api/taxes", { id })

/**
 * Deja la tabla de impuestos sin ninguno activo y devuelve cómo volver a dejarla
 * como estaba: cada flujo parte de un costeo sin impuestos y carga los suyos.
 */
export const suspendTaxes = async (client: ApiClient): Promise<() => Promise<void>> => {
    const active = (await listTaxes(client)).filter((tax) => tax.is_active)

    for (const tax of active) await patchTax(client, { id: tax.id, is_active: false })

    return async () => {
        for (const tax of active) await patchTax(client, { id: tax.id, is_active: true })
    }
}

export const findSupply = async (client: ApiClient, name: string): Promise<Supply> => {
    const supply = (await listSupplies(client)).find((item) => item.name === name)

    if (!supply) throw new Error(`El insumo "${name}" no está en la base sembrada`)

    return supply
}

export const findProduct = async (client: ApiClient, name: string): Promise<Product> => {
    const product = (await listProducts(client)).find((item) => item.name === name)

    if (!product) throw new Error(`El producto "${name}" no está en la base sembrada`)

    return product
}

export const findPaymentMethod = async (client: ApiClient, name: string): Promise<Payment> => {
    const method = (await listPaymentMethods(client)).find((item) => item.name === name)

    if (!method) throw new Error(`El método de pago "${name}" no está en la base sembrada`)

    return method
}

export const readStock = async (client: ApiClient): Promise<StockByName> =>
    new Map((await client.get<SupplyStock[]>("/api/stock")).map((row) => [row.name, row.current_stock]))

export const stockOf = (stock: StockByName, name: string): number => {
    const current = stock.get(name)

    if (current === undefined) throw new Error(`El insumo "${name}" no aparece en el stock`)

    return current
}

export const createOrder = (
    client: ApiClient,
    items: OrderLine[],
    status: Extract<OrderStatus, "pending" | "paid">,
    payments: PaymentLine[] = [],
): Promise<Order> => client.post<Order>("/api/orders", { items, status, payments })

export const payOrder = (client: ApiClient, orderId: number, payments: PaymentLine[]): Promise<Order> =>
    client.post<Order>(`/api/orders/${orderId}/pay`, { payments })

export const cancelOrder = (client: ApiClient, orderId: number): Promise<Order> =>
    client.post<Order>(`/api/orders/${orderId}/cancel`)

export const readOrder = (client: ApiClient, orderId: number): Promise<Order> =>
    client.get<Order>(`/api/orders/${orderId}`)

export const listOrders = (client: ApiClient): Promise<Order[]> => client.get<Order[]>("/api/orders")

export const listCashSessions = (client: ApiClient): Promise<CashSessionWithPayments[]> =>
    client.get<CashSessionWithPayments[]>("/api/cash-sessions")

export const findOpenCashSession = (client: ApiClient): Promise<CashSession | null> =>
    client.get<CashSession | null>("/api/cash-sessions?status=open")

export const openCashSession = (client: ApiClient, openingAmount: number): Promise<CashSession> =>
    client.post<CashSession>("/api/cash-sessions", { opening_amount: openingAmount, note: null })

export const closeCashSession = (
    client: ApiClient,
    sessionId: number,
    countedAmount: number,
): Promise<CashSession> =>
    client.patch<CashSession>(`/api/cash-sessions/${sessionId}`, {
        counted_amount: countedAmount,
        note: null,
    })

export const listCashMovements = (client: ApiClient, sessionId: number): Promise<CashMovement[]> =>
    client.get<CashMovement[]>(`/api/cash-sessions/${sessionId}/movements`)

export const createCashMovement = (
    client: ApiClient,
    sessionId: number,
    type: CashMovementType,
    amount: number,
    concept: string,
): Promise<CashMovement> =>
    client.post<CashMovement>(`/api/cash-sessions/${sessionId}/movements`, { type, amount, concept })

/**
 * Cada flujo prepara su propia caja: si quedó una abierta de un flujo anterior, se
 * cierra antes de abrir la que este test necesita.
 */
export const startFreshCashSession = async (
    client: ApiClient,
    openingAmount: number,
): Promise<CashSession> => {
    const leftover = await findOpenCashSession(client)

    if (leftover) await closeCashSession(client, leftover.id, leftover.opening_amount)

    return openCashSession(client, openingAmount)
}

export const purchase = (
    client: ApiClient,
    lines: { supply_id: number; quantity: number; unit_price: number }[],
): Promise<{ id: number; total: number }> =>
    client.post<{ id: number; total: number }>("/api/purchases", {
        supplier_name: "Proveedor de prueba",
        purchased_at: new Date().toISOString(),
        note: null,
        lines,
    })

export const produce = (
    client: ApiClient,
    supplyId: number,
    quantity: number,
): Promise<{ id: number; unit_cost: number }> =>
    client.post<{ id: number; unit_cost: number }>("/api/production", {
        supply_id: supplyId,
        quantity,
        produced_at: new Date().toISOString(),
        note: null,
    })

export const listStockMovements = (client: ApiClient): Promise<StockMovement[]> =>
    client.get<StockMovement[]>("/api/stock/movements")

export const registerWaste = (
    client: ApiClient,
    supplyId: number,
    quantity: number,
    note: string,
): Promise<StockMovement> =>
    client.post<StockMovement>("/api/stock/movements", {
        supply_id: supplyId,
        type: "waste",
        quantity,
        direction: "out",
        note,
    })

export const registerAdjustment = (
    client: ApiClient,
    supplyId: number,
    quantity: number,
    note: string,
): Promise<StockMovement> =>
    client.post<StockMovement>("/api/stock/movements", {
        supply_id: supplyId,
        type: "adjustment",
        quantity,
        direction: "out",
        note,
    })

export const readCosting = (client: ApiClient, month: string): Promise<CostingReport> =>
    client.get<CostingReport>(`/api/costing?month=${month}`)

/** El costo con el que la API valúa un insumo comprado: precio sobre rendimiento. */
export const supplyUnitCost = (supply: Supply): number => supply.purchase_price / supply.yield_factor
