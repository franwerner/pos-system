export type OrderPricedItem = {
    quantity: number
    unit_price: number
}

export const calculateOrderSubTotal = (items: OrderPricedItem[]): number => {
    const subTotal = items.reduce((total, item) => {
        if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
            throw new Error("La cantidad pedida debe ser un número mayor a 0")
        }

        if (!Number.isFinite(item.unit_price) || item.unit_price < 0) {
            throw new Error("El precio unitario debe ser un número mayor o igual a 0")
        }

        return total + item.unit_price * item.quantity
    }, 0)

    return Math.round(subTotal * 100) / 100
}
