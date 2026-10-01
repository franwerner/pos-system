import { SUPPLY_TYPES, type SupplyType } from "@/features/supplies/types/supply.type"
import { type WastePercentages } from "./calculateProductCosting.service"
import {
    calculateWastePercentage,
    type AppliedWaste,
    type CostedMovement,
} from "./calculateWastePercentage.service"

export type TypedCostedMovement = CostedMovement & { supply_type: SupplyType }

export type MeasuredWasteByType = Record<SupplyType, AppliedWaste>

/**
 * La pérdida medida del período, abierta por tipo de insumo.
 *
 * Los porcentajes declarados son tres, uno por tipo: medir un único porcentaje global
 * dejaba la comparación despareja y el botón de adoptar sin sentido. Cada tipo se mide
 * contra su propio consumo, y el porcentaje declarado de ese tipo es el respaldo cuando
 * el período no tuvo consumo con qué medirlo.
 *
 * Sigue siendo información: el costeo usa los porcentajes declarados, no estos.
 */
export const calculateWasteByType = (
    movements: TypedCostedMovement[],
    estimatedWastePercentages: WastePercentages,
): MeasuredWasteByType =>
    SUPPLY_TYPES.reduce((measured, type) => ({
        ...measured,
        [type]: calculateWastePercentage(
            movements.filter((movement) => movement.supply_type === type),
            estimatedWastePercentages[type],
        ),
    }), {} as MeasuredWasteByType)
