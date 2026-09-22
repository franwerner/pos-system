export const calculateSupplyCost = (purchasePrice: number, yieldFactor: number): number => {
    if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
        throw new Error("El precio de compra debe ser un número mayor o igual a 0")
    }

    if (!Number.isFinite(yieldFactor) || yieldFactor <= 0) {
        throw new Error("El factor de rendimiento debe ser un número mayor a 0")
    }

    return purchasePrice / yieldFactor
}
