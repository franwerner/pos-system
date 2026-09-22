import { type StockMovementType } from "@/features/stock/types/stock.type"

export const WASTE_BASES = ["real", "estimated"] as const

export type WasteBasis = (typeof WASTE_BASES)[number]

export type CostedMovement = {
    type: StockMovementType
    quantity: number
    unit_cost: number
}

export type AppliedWaste = {
    percentage: number
    waste_cost: number
    consumption_cost: number
    basis: WasteBasis
}

// Salidas de insumo hacia un producto vendido o hacia un preparado: contra eso se
// mide lo que se perdió.
const CONSUMPTION_TYPES: StockMovementType[] = ["sale", "production_out"]

const movementCost = ({ quantity, unit_cost }: CostedMovement): number => {
    if (!Number.isFinite(quantity)) {
        throw new Error("La cantidad del movimiento debe ser un número")
    }

    if (!Number.isFinite(unit_cost) || unit_cost < 0) {
        throw new Error("El costo del movimiento debe ser un número mayor o igual a 0")
    }

    return Math.abs(quantity) * unit_cost
}

const sumCost = (movements: CostedMovement[], types: StockMovementType[]): number =>
    movements
        .filter((movement) => types.includes(movement.type))
        .reduce((total, movement) => total + movementCost(movement), 0)

// Un ajuste negativo corrige un error de carga; la merma es una pérdida declarada
// a propósito. Solo los movimientos de merma cuentan como merma.
//
// Sin consumo el mes no tiene contra qué medir la pérdida: recién ahí entra el
// porcentaje de respaldo cargado en los parámetros de costeo.
export const calculateWastePercentage = (
    movements: CostedMovement[],
    estimatedWastePercentage: number,
): AppliedWaste => {
    if (!Number.isFinite(estimatedWastePercentage) || estimatedWastePercentage < 0) {
        throw new Error("La merma estimada debe ser un número mayor o igual a 0")
    }

    const wasteCost = sumCost(movements, ["waste"])
    const consumptionCost = sumCost(movements, CONSUMPTION_TYPES)
    const basis: WasteBasis = consumptionCost > 0 ? "real" : "estimated"

    return {
        percentage: basis === "real"
            ? (wasteCost / consumptionCost) * 100
            : estimatedWastePercentage,
        waste_cost: wasteCost,
        consumption_cost: consumptionCost,
        basis,
    }
}
