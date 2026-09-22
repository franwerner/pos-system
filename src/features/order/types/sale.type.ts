import { type Tables } from "@/shared/types/database.types"
import { type SaleItem } from "./sale-item.type"

export type OrderStatus = "pending" | "paid" | "cancelled"

type SalePaymentMethod = Pick<Tables<"payment_method">, "name" | "tax">

export type SalePayment = Tables<"sale_payment"> & {
    payment_method: SalePaymentMethod | null
}

export type Sale = Tables<"sale"> & {
    items: SaleItem[]
    payments: SalePayment[]
}

export type Order = Sale

export type OrderItemInput = {
    product_id: number
    quantity: number
}

export type OrderPaymentInput = {
    payment_method_id: number
    amount: number
}

export type CreateOrderInput = {
    items: OrderItemInput[]
    status: Extract<OrderStatus, "pending" | "paid">
    payments?: OrderPaymentInput[]
}

export type PayOrderInput = {
    id: number
    payments: OrderPaymentInput[]
}
