import { type Tables } from "@/shared/types/database.types"

export const CASH_MOVEMENT_TYPES = ["deposit", "withdrawal"] as const

export type CashMovementType = (typeof CASH_MOVEMENT_TYPES)[number]

export type CashMovement = Omit<Tables<"cash_movement">, "type"> & {
    type: CashMovementType
}

export const CASH_MOVEMENT_TYPE_LABELS: Record<CashMovementType, string> = {
    deposit: "Ingreso",
    withdrawal: "Egreso",
}

export type CreateCashMovementInput = {
    cash_session_id: number
    type: CashMovementType
    amount: number
    concept: string
}
