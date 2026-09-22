export type SaleCartLine = {
    product_id: number
    quantity: number
}

export type ProductCompositionLine = {
    product_id: number
    supply_id: number
    quantity: number
    unit_cost: number
}

export type SupplyConsumption = {
    supply_id: number
    quantity: number
    unit_cost: number
}

export type StockShortage = {
    supply_id: number
    required: number
    available: number
}

// Un producto sin líneas de composición no descuenta nada: es la única regla del
// modelo, no hay bandera de "controla stock".
export const calculateSaleConsumption = (
    cart: SaleCartLine[],
    composition: ProductCompositionLine[],
): SupplyConsumption[] => {
    const consumptionBySupply = new Map<number, SupplyConsumption>()

    for (const item of cart) {
        if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
            throw new Error("La cantidad vendida debe ser un número mayor a 0")
        }

        const lines = composition.filter((line) => line.product_id === item.product_id)

        for (const line of lines) {
            if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
                throw new Error("La cantidad de la composición debe ser un número mayor a 0")
            }

            const current = consumptionBySupply.get(line.supply_id)

            consumptionBySupply.set(line.supply_id, {
                supply_id: line.supply_id,
                quantity: (current?.quantity ?? 0) - line.quantity * item.quantity,
                unit_cost: line.unit_cost,
            })
        }
    }

    return [...consumptionBySupply.values()]
}

export const findStockShortages = (
    consumption: SupplyConsumption[],
    stock: { supply_id: number; current_stock: number }[],
): StockShortage[] =>
    consumption.reduce<StockShortage[]>((shortages, item) => {
        const required = -item.quantity
        const available = stock.find((row) => row.supply_id === item.supply_id)?.current_stock ?? 0

        return available < required
            ? [...shortages, { supply_id: item.supply_id, required, available }]
            : shortages
    }, [])
