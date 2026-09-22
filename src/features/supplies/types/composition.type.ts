import { type SupplyUnit } from "./supply.type"

export type CompositionLineInput = {
    supply_id: number
    quantity: number
}

export type CompositionSupply = {
    id: number
    name: string
    unit: SupplyUnit
}
