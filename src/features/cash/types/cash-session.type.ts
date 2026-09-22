import { type Tables } from "@/shared/types/database.types"
import { type CashCountSale } from "../services/calculateCashCount.service"
import { type CashMovement } from "./cash-movement.type"

export type CashSession = Tables<"cash_session">

/** Un pago cobrado en esta caja: lo que entró por ese método, ajuste incluido. */
export type CashSessionPayment = CashCountSale

export type CashSessionWithPayments = CashSession & {
    payments: CashSessionPayment[]
    movements: CashMovement[]
}

export type OpenCashSessionInput = {
    opening_amount: number
    note: string | null
}

export type CloseCashSessionInput = {
    id: number
    counted_amount: number
    note: string | null
}
