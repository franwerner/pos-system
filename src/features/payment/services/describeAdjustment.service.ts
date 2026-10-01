import formatCurrency from "@/shared/utils/formatCurrency.util"
import { type AdjustmentKind } from "../types/payment.type"

/**
 * El tipo de ajuste (Design/export/15-admin-payment-methods lo trata como dato
 * precalculado) no existe como columna: se deriva del signo de `tax` al integrar.
 */
export const getAdjustmentKind = (tax: number): AdjustmentKind => {
    if (tax === 0) return "lista"

    return tax < 0 ? "descuento" : "recargo"
}

/** El nombre del ajuste sale del signo: negativo descuenta, positivo recarga. */
export const adjustmentLabel = (value: number, plural = false): string => {
    if (value === 0) return plural ? "Ajustes" : "Ajuste"

    if (value < 0) return plural ? "Descuentos" : "Descuento"

    return plural ? "Recargos" : "Recargo"
}

/** El signo explícito distingue de un vistazo el descuento del recargo. */
export const formatAdjustmentPercentage = (tax: number): string => `${tax > 0 ? "+" : ""}${tax}%`

/**
 * Nota completa de un pago con ajuste, ej. "Descuento -10%: -$1.000". `undefined`
 * si ese método no tiene ajuste configurado (nada que aclarar en el ticket).
 */
export const describePaymentAdjustmentNote = (tax: number, surchargeAmount: number): string | undefined => {
    if (tax === 0) return undefined

    return `${adjustmentLabel(tax)} ${formatAdjustmentPercentage(tax)}: ${formatCurrency(surchargeAmount)}`
}
