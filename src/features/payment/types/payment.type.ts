import { type Tables } from "@/shared/types/database.types"

export type Payment = Tables<"payment_method">

export type PaymentMethodInput = {
    name: string
    tax: number
    is_active: boolean
}

/**
 * Cómo se lee el ajuste de una tarifa al cliente: a favor (descuento), en contra
 * (recargo) o neutro (precio de lista). No se guarda: se deriva del signo de `tax`.
 */
export type AdjustmentKind = "descuento" | "recargo" | "lista"

/** Una parte del cobro mientras el usuario la está repartiendo en la UI. */
export type PaymentDraft = {
    payment_method_id: number
    amount: number
}
