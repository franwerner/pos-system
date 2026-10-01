import { type StockMovementType } from "@/features/stock/types/stock.type"
import { type SupplyType } from "@/features/supplies/types/supply.type"
import { getServerSupabase } from "@/server/supabase"
import {
    calculateWasteByType,
    type MeasuredWasteByType,
    type TypedCostedMovement,
} from "../services/calculateWasteByType.service"
import { type WastePercentages } from "../services/calculateProductCosting.service"
import { resolveMonthRange } from "../services/resolveMonthRange.service"
import { type MeasuredParameters } from "../types/costing.type"

const COSTED_MOVEMENT_TYPES: StockMovementType[] = ["waste", "sale", "production_out"]

const fetchTypedMovements = async (month: string): Promise<TypedCostedMovement[]> => {
    const { from, to } = resolveMonthRange(month)

    const { data, error } = await getServerSupabase()
        .from("stock_movement")
        .select("type, quantity, unit_cost, supply!inner(type)")
        .in("type", COSTED_MOVEMENT_TYPES)
        .gte("created_at", from)
        .lt("created_at", to)

    if (error) throw new Error(error.message)

    return (data ?? []).map((movement) => ({
        type: movement.type as StockMovementType,
        quantity: movement.quantity,
        unit_cost: movement.unit_cost,
        supply_type: movement.supply.type as SupplyType,
    }))
}

/** La pérdida real del período por tipo de insumo, para comparar con la declarada. */
export const loadMeasuredWaste = async (
    month: string,
    wastePercentages: WastePercentages,
): Promise<MeasuredWasteByType> =>
    calculateWasteByType(await fetchTypedMovements(month), wastePercentages)

// Todo parámetro estimado del sistema se declara y nunca se mueve solo; al lado viaja
// lo que los datos del período dicen, y adoptarlo es un acto explícito del usuario.
// Este es el lado medido, entero y en un solo lugar.
export const loadMeasuredParameters = async (
    month: string,
    wastePercentages: WastePercentages,
): Promise<MeasuredParameters> => ({
    month,
    waste: await loadMeasuredWaste(month, wastePercentages),
})
