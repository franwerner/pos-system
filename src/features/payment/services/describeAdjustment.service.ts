/** El nombre del ajuste sale del signo: negativo descuenta, positivo recarga. */
export const adjustmentLabel = (value: number, plural = false): string => {
    if (value === 0) return plural ? "Ajustes" : "Ajuste"

    if (value < 0) return plural ? "Descuentos" : "Descuento"

    return plural ? "Recargos" : "Recargo"
}

/** El signo explícito distingue de un vistazo el descuento del recargo. */
export const formatAdjustmentPercentage = (tax: number): string => `${tax > 0 ? "+" : ""}${tax}%`
