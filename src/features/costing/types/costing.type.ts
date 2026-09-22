import { type SupplyType, type SupplyUnit } from "@/features/supplies/types/supply.type"
import { type Tax, type TaxContext } from "@/features/taxes/types/tax.type"
import { type MeasuredFixedCost } from "../services/calculateMeasuredFixedCost.service"
import { type AppliedWaste } from "../services/calculateWastePercentage.service"
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

/** Todo lo que hace falta para costear un producto, sin los productos. */
export type CostingContext = {
    tax: TaxContext
    active_taxes: Tax[]
    waste_percentages: WastePercentages
    fixed_cost_per_unit: MeasuredFixedCost
}

export type CostingReport = CostingContext & {
    month: string
    sold_units: number
    fixed_cost_total: number
    measured_waste: AppliedWaste
    rows: ProductCostingRow[]
}
