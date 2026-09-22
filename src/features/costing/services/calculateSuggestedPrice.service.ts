import { type TaxContext } from "@/features/taxes/types/tax.type"
import { grossSaleAmount } from "./calculateNetAmount.service"

export type SuggestedPriceParams = {
    totalCost: number
    /** `null` es un producto sin margen objetivo: no hay precio sugerido que calcular. */
    targetMarginPercentage: number | null
    tax: TaxContext
}

// El margen buscado se mide sobre lo que efectivamente entra: el sugerido es el
// bruto que, después de los impuestos que se van del precio, deja ese margen.
export const calculateSuggestedPrice = ({
    totalCost,
    targetMarginPercentage,
    tax,
}: SuggestedPriceParams): number | null => {
    if (!Number.isFinite(totalCost) || totalCost < 0) {
        throw new Error("El costo total debe ser un número mayor o igual a 0")
    }

    if (targetMarginPercentage === null) return null

    if (
        !Number.isFinite(targetMarginPercentage)
        || targetMarginPercentage < 0
        || targetMarginPercentage >= 100
    ) {
        throw new Error("El margen objetivo debe estar entre 0 y 99,99")
    }

    return grossSaleAmount(totalCost / (1 - targetMarginPercentage / 100), tax)
}
