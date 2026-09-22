import { formatPeriod, toPeriodDate } from "@/features/fixed-costs/services/resolvePeriod.service"
import { type MeasuredFixedCost } from "./calculateMeasuredFixedCost.service"

export const CONFIDENCE_LABELS: Record<MeasuredFixedCost["confidence"], string> = {
    preliminary: "Preliminar",
    single_month: "Basada en tus números",
    averaged: "Promedio de meses cerrados",
}

const monthLabels = (months: string[]): string[] =>
    months.map((month) => formatPeriod(toPeriodDate(month)))

// El nivel de confianza no es decoración: dice con cuántos meses reales se
// repartieron los costos fijos, y sin ninguno avisa que el número todavía no los
// incluye en vez de inventar un supuesto.
export const describeConfidence = (fixedCost: MeasuredFixedCost): string => {
    const labels = monthLabels(fixedCost.months)

    if (fixedCost.confidence === "preliminary") {
        return "Todavía no hay ningún mes cerrado con ventas: el precio sugerido cubre solo el costo variable, sin repartir los costos fijos."
    }

    if (fixedCost.confidence === "single_month") {
        return `Basada en tus números de ${labels[0]}.`
    }

    return `Promedio de ${labels.length} meses cerrados: ${labels.join(", ")}.`
}
