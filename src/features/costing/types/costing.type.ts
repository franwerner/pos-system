import { type SupplyType, type SupplyUnit } from "@/features/supplies/types/supply.type"
import { type MeasuredWasteByType } from "../services/calculateWasteByType.service"
import {
    type ProductCostingRow,
    type WastePercentages,
} from "../services/calculateProductCosting.service"

export type CostingSupplyLine = {
    supply_id: number
    name: string
    type: SupplyType
    unit: SupplyUnit
    quantity: number
    unit_cost: number
}

export type CostableProduct = {
    product_id: number
    name: string
    price: number
    /** `null` es un producto sin margen objetivo: no tiene precio sugerido. */
    target_margin_percentage: number | null
    lines: CostingSupplyLine[]
}

/**
 * Todo lo que hace falta para costear un producto, sin los productos. Impuestos,
 * comisiones y costo fijo por unidad quedan fuera (ver PLAN/01-modelo-de-costo.md):
 * el margen objetivo de cada producto tiene que cubrirlos.
 */
export type CostingContext = {
    waste_percentages: WastePercentages
}

export type CostingReport = CostingContext & {
    month: string
    measured_waste: MeasuredWasteByType
    rows: ProductCostingRow[]
}

/**
 * El lado medido de los parámetros estimados: lo que los datos del período dicen, al
 * lado de lo declarado. No entra al cálculo hasta que el usuario lo adopta.
 */
export type MeasuredParameters = {
    month: string
    waste: MeasuredWasteByType
}
