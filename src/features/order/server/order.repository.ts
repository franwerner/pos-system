import { ApiError } from "@/server/api/api-error"
import { getServerSupabase } from "@/server/supabase"
import {
    calculateSaleConsumption,
    type ProductCompositionLine,
    type SupplyConsumption,
} from "@/features/stock/services/calculateSaleConsumption.service"
import { calculateSupplyCost } from "@/features/supplies/services/calculateSupplyCost.service"
import { type SalePaymentLine } from "@/features/payment/services/calculateSalePayments.service"
import { type Order, type OrderItemInput, type OrderStatus } from "../types/sale.type"

export const ORDER_SELECT =
    "*, items:sale_item(*, product(name, img_url, description)), payments:sale_payment(*, payment_method(name, tax))"

export const readOrderId = (params: Record<string, string | string[]>): number => {
    const raw = Array.isArray(params.id) ? params.id[0] : params.id
    const id = Number(raw)

    if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "El pedido no es válido")

    return id
}

export const listOrders = async (status?: OrderStatus): Promise<Order[]> => {
    const query = getServerSupabase()
        .from("sale")
        .select(ORDER_SELECT)
        .order("created_at", { ascending: false })

    const { data, error } = status ? await query.eq("status", status) : await query

    if (error) throw new Error(error.message)

    return (data ?? []) as unknown as Order[]
}

export const findOrder = async (id: number): Promise<Order | null> => {
    const { data, error } = await getServerSupabase()
        .from("sale")
        .select(ORDER_SELECT)
        .eq("id", id)
        .order("id", { referencedTable: "sale_item" })
        .maybeSingle()

    if (error) throw new Error(error.message)

    return (data ?? null) as unknown as Order | null
}

export const requireOrder = async (id: number): Promise<Order> => {
    const order = await findOrder(id)

    if (!order) throw new ApiError(404, "El pedido no existe")

    return order
}

export const requirePendingOrder = async (id: number): Promise<Order> => {
    const order = await requireOrder(id)

    if (order.status !== "pending") {
        throw new ApiError(409, order.status === "paid"
            ? "El pedido ya está cobrado"
            : "El pedido está cancelado")
    }

    return order
}

export const resolveDefaultEmployeeId = async (): Promise<string> => {
    const { data, error } = await getServerSupabase()
        .from("app_config")
        .select("default_employee_id")
        .limit(1)
        .maybeSingle()

    if (error) throw new Error(error.message)

    if (!data?.default_employee_id) {
        throw new ApiError(400, "La configuración no tiene un empleado por defecto")
    }

    return data.default_employee_id
}

export type PricedOrderItem = {
    product_id: number
    quantity: number
    unit_price: number
}

/** El precio sale del producto, nunca del pedido: el cliente no decide cuánto vale. */
export const priceOrderItems = async (items: OrderItemInput[]): Promise<PricedOrderItem[]> => {
    const productIds = [...new Set(items.map((item) => item.product_id))]

    const { data, error } = await getServerSupabase()
        .from("product")
        .select("id, price, is_active")
        .in("id", productIds)

    if (error) throw new Error(error.message)

    return items.map((item) => {
        const product = (data ?? []).find((row) => row.id === item.product_id)

        if (!product) throw new ApiError(400, `El producto #${item.product_id} no existe`)
        if (!product.is_active) throw new ApiError(400, `El producto #${item.product_id} está dado de baja`)

        return { product_id: item.product_id, quantity: item.quantity, unit_price: product.price }
    })
}

const loadCompositionLines = async (productIds: number[]): Promise<ProductCompositionLine[]> => {
    if (productIds.length === 0) return []

    const { data, error } = await getServerSupabase()
        .from("product_supply")
        .select("product_id, supply_id, quantity, supply(purchase_price, yield_factor)")
        .in("product_id", productIds)

    if (error) throw new Error(error.message)

    return (data ?? []).map((line) => ({
        product_id: line.product_id,
        supply_id: line.supply_id,
        quantity: line.quantity,
        unit_cost: line.supply
            ? calculateSupplyCost(line.supply.purchase_price, line.supply.yield_factor)
            : 0,
    }))
}

export const calculateOrderConsumption = async (
    items: PricedOrderItem[],
): Promise<SupplyConsumption[]> => {
    const composition = await loadCompositionLines([...new Set(items.map((item) => item.product_id))])

    return calculateSaleConsumption(
        items.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
        composition,
    )
}

export const insertStockMovements = async (
    saleId: number,
    movements: { supply_id: number; quantity: number; unit_cost: number }[],
    note: string | null = null,
): Promise<void> => {
    if (movements.length === 0) return

    const { error } = await getServerSupabase()
        .from("stock_movement")
        .insert(movements.map((movement) => ({
            supply_id: movement.supply_id,
            type: "sale",
            quantity: movement.quantity,
            unit_cost: movement.unit_cost,
            sale_id: saleId,
            note,
        })))

    if (error) throw new Error(error.message)
}

export const listSaleStockMovements = async (
    saleId: number,
): Promise<{ supply_id: number; quantity: number; unit_cost: number }[]> => {
    const { data, error } = await getServerSupabase()
        .from("stock_movement")
        .select("supply_id, quantity, unit_cost")
        .eq("sale_id", saleId)
        .eq("type", "sale")

    if (error) throw new Error(error.message)

    return data ?? []
}

export const insertSalePayments = async (
    saleId: number,
    lines: SalePaymentLine[],
): Promise<void> => {
    if (lines.length === 0) return

    const { error } = await getServerSupabase()
        .from("sale_payment")
        .insert(lines.map((line) => ({ ...line, sale_id: saleId })))

    if (error) throw new Error(error.message)
}

// PostgREST no abarca las inserciones en una transacción: si un paso falla, los
// movimientos ya escritos dejarían el stock descontado por una venta que no existe.
export const rollbackSale = async (saleId: number): Promise<void> => {
    const supabase = getServerSupabase()

    await supabase.from("stock_movement").delete().eq("sale_id", saleId)
    await supabase.from("sale").delete().eq("id", saleId)
}

/** Cuando hay un solo pago la columna vieja sigue diciendo la verdad; con varios, no. */
export const resolveLegacyPaymentMethodId = (lines: SalePaymentLine[]): number | null =>
    lines.length === 1 ? lines[0].payment_method_id : null
