import { type StockMovement } from "@/features/stock/types/stock.type"
import { type SupplyOrigin, type SupplyUnit } from "@/features/supplies/types/supply.type"
import { type Tables } from "@/shared/types/database.types"
import { type ProductionComponentLine } from "../services/calculateProductionCost.service"

export type Production = Tables<"production">

export type ProductionMovement = StockMovement & {
    supply: { name: string; unit: SupplyUnit } | null
}

export type ProductionWithDetail = Production & {
    supply: { name: string; unit: SupplyUnit } | null
    stock_movement: ProductionMovement[]
}

export type ProducibleSupply = {
    id: number
    name: string
    unit: SupplyUnit
}

export type ProductionComponent = ProductionComponentLine & {
    name: string
    unit: SupplyUnit
    origin: SupplyOrigin
}

export type ProductionInput = {
    supply_id: number
    quantity: number
    produced_at: string
    note: string | null
}
