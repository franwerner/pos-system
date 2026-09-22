export type PurchaseAmountLine = {
    quantity: number
    unit_price: number
}

export const calculateLineAmount = ({ quantity, unit_price }: PurchaseAmountLine): number => {
    if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("La cantidad de la línea debe ser un número mayor a 0")
    }

    if (!Number.isFinite(unit_price) || unit_price < 0) {
        throw new Error("El precio unitario debe ser un número mayor o igual a 0")
    }

    return quantity * unit_price
}

export const calculatePurchaseTotal = (lines: PurchaseAmountLine[]): number =>
    lines.reduce((total, line) => total + calculateLineAmount(line), 0)
