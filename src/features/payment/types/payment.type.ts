import { type Tables } from "@/shared/types/database.types"

export type Payment = Tables<"payment_method">

export type PaymentMethodInput = {
    name: string
    tax: number
    is_active: boolean
}

/** Una parte del cobro mientras el usuario la está repartiendo en la UI. */
export type PaymentDraft = {
    payment_method_id: number
    amount: number
}
