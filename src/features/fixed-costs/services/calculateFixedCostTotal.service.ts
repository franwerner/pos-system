export type FixedCostAmount = {
    amount: number
}

export const calculateFixedCostTotal = (costs: FixedCostAmount[]): number =>
    costs.reduce((total, cost) => {
        if (!Number.isFinite(cost.amount) || cost.amount < 0) {
            throw new Error("El monto del costo fijo debe ser un número mayor o igual a 0")
        }

        return total + cost.amount
    }, 0)
