import { type Tables } from "@/shared/types/database.types"

export const SUPPLY_TYPES = ["food", "packaging", "drink"] as const
export const SUPPLY_ORIGINS = ["purchased", "produced"] as const
export const SUPPLY_UNITS = ["u", "gr", "ml"] as const

export type SupplyType = (typeof SUPPLY_TYPES)[number]
export type SupplyOrigin = (typeof SUPPLY_ORIGINS)[number]
export type SupplyUnit = (typeof SUPPLY_UNITS)[number]

export type Supply = Omit<Tables<"supply">, "type" | "origin" | "unit"> & {
    type: SupplyType
    origin: SupplyOrigin
    unit: SupplyUnit
}

// Un preparado no tiene precio de compra: su costo sale de la última producción,
// así que el listado lo trae para que el costeo en vivo lo pueda resolver.
export type SupplyWithCost = Supply & {
    last_production_unit_cost: number | null
}

export type SupplyInput = {
    name: string
    type: SupplyType
    origin: SupplyOrigin
    unit: SupplyUnit
    purchase_price: number
    yield_factor: number
    min_stock: number
}

export type SupplyFilter = {
    search: string
    type: SupplyType | "all"
    onlyActive: boolean
}

export const SUPPLY_TYPE_LABELS: Record<SupplyType, string> = {
    food: "Comida",
    packaging: "Packaging",
    drink: "Bebida",
}

export const SUPPLY_ORIGIN_LABELS: Record<SupplyOrigin, string> = {
    purchased: "Comprado",
    produced: "Preparado",
}

export const SUPPLY_UNIT_LABELS: Record<SupplyUnit, string> = {
    u: "Unidad (u)",
    gr: "Gramos (gr)",
    ml: "Mililitros (ml)",
}
