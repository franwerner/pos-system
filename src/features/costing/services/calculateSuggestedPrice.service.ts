export type SuggestedPriceParams = {
    variableCost: number
    /** `null` es un producto sin margen objetivo: no hay precio sugerido que calcular. */
    targetMarginPercentage: number | null
}

// El sugerido sale del costo variable, no de uno con costo fijo repartido: el margen
// objetivo que carga cada producto ya tiene que contemplar impuestos, comisiones y
// gastos fijos (ver PLAN/02-impuestos.md y PLAN/03-medios-de-pago.md), así que un local
// recién abierto tiene precio sugerido sin necesitar un mes cerrado.
export const calculateSuggestedPrice = ({
    variableCost,
    targetMarginPercentage,
}: SuggestedPriceParams): number | null => {
    if (!Number.isFinite(variableCost) || variableCost < 0) {
        throw new Error("El costo variable debe ser un número mayor o igual a 0")
    }

    if (targetMarginPercentage === null) return null

    if (
        !Number.isFinite(targetMarginPercentage)
        || targetMarginPercentage < 0
        || targetMarginPercentage >= 100
    ) {
        throw new Error("El margen objetivo debe estar entre 0 y 99,99")
    }

    return variableCost / (1 - targetMarginPercentage / 100)
}
