import { type SupplyUnit } from "@/features/supplies/types/supply.type"
import { type Tables } from "@/shared/types/database.types"

export const STOCK_MOVEMENT_TYPES = [
    "purchase",
    "sale",
    "production_in",
    "production_out",
    "waste",
    "adjustment",
] as const

export const MANUAL_MOVEMENT_TYPES = ["waste", "adjustment"] as const
export const MOVEMENT_DIRECTIONS = ["in", "out"] as const

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number]
export type ManualMovementType = (typeof MANUAL_MOVEMENT_TYPES)[number]
export type MovementDirection = (typeof MOVEMENT_DIRECTIONS)[number]

export type StockMovement = Omit<Tables<"stock_movement">, "type"> & {
    type: StockMovementType
}

// La vista agrupa por insumo, así que ninguna columna puede venir en null pese a
// que el tipo generado las marque como opcionales.
export type SupplyStock = {
    supply_id: number
    name: string
    unit: SupplyUnit
    min_stock: number
    current_stock: number
}

export type StockFilter = {
    search: string
    onlyBelowMinimum: boolean
}

export type ManualMovementInput = {
    supply_id: number
    type: ManualMovementType
    quantity: number
    direction: MovementDirection
    note: string | null
}

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
    purchase: "Compra",
    sale: "Venta",
    production_in: "Producción (ingreso)",
    production_out: "Producción (consumo)",
    waste: "Pérdida",
    adjustment: "Ajuste",
}

export const MANUAL_MOVEMENT_TYPE_LABELS: Record<ManualMovementType, string> = {
    waste: "Pérdida",
    adjustment: "Ajuste",
}

export const MOVEMENT_DIRECTION_LABELS: Record<MovementDirection, string> = {
    in: "Entrada (suma)",
    out: "Salida (resta)",
}
