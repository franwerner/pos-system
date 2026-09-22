import { type Tables } from "@/shared/types/database.types"

export type FixedCost = Tables<"fixed_cost">

export type FixedCostInput = {
    concept: string
    amount: number
    period: string
}

export type FixedCostFilter = {
    month: string
}
