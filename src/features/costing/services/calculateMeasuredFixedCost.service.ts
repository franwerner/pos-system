export const COSTING_CONFIDENCES = ["preliminary", "single_month", "averaged"] as const

export type CostingConfidence = (typeof COSTING_CONFIDENCES)[number]

export type ClosedMonthSource = {
    month: string
    fixedCostTotal: number
    soldUnits: number
}

export type MeasuredFixedCost = {
    confidence: CostingConfidence
    months: string[]
    fixed_cost_total: number
    sold_units: number
    amount_per_unit: number
}

const PRELIMINARY: MeasuredFixedCost = {
    confidence: "preliminary",
    months: [],
    fixed_cost_total: 0,
    sold_units: 0,
    amount_per_unit: 0,
}

const assertSource = ({ fixedCostTotal, soldUnits }: ClosedMonthSource) => {
    if (!Number.isFinite(fixedCostTotal) || fixedCostTotal < 0) {
        throw new Error("El total de costos fijos debe ser un número mayor o igual a 0")
    }

    if (!Number.isFinite(soldUnits) || soldUnits < 0) {
        throw new Error("Las unidades vendidas deben ser un número mayor o igual a 0")
    }
}

const average = (values: number[]): number =>
    values.reduce((total, value) => total + value, 0) / values.length

// El mes en curso está siempre a medio hacer: tiene los costos fijos enteros y
// solo las ventas que van, así que a principio de mes cada plato cargaría miles
// de pesos de alquiler. Un mes cerrado es un mes completo y el número queda
// quieto; con varios, el promedio los alisa.
export const calculateMeasuredFixedCost = (
    closedMonths: ClosedMonthSource[],
): MeasuredFixedCost => {
    closedMonths.forEach(assertSource)

    const usable = closedMonths
        .filter((month) => month.soldUnits > 0)
        .sort((a, b) => a.month.localeCompare(b.month))

    if (usable.length === 0) return PRELIMINARY

    return {
        confidence: usable.length === 1 ? "single_month" : "averaged",
        months: usable.map((month) => month.month),
        fixed_cost_total: average(usable.map((month) => month.fixedCostTotal)),
        sold_units: average(usable.map((month) => month.soldUnits)),
        amount_per_unit: average(usable.map((month) => month.fixedCostTotal / month.soldUnits)),
    }
}
