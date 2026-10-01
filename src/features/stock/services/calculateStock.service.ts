import {
    type ManualMovementType,
    type MovementDirection,
    type StockStatus,
} from "../types/stock.type"

export const sumStockMovements = (movements: { quantity: number }[]): number =>
    movements.reduce((stock, movement) => {
        if (!Number.isFinite(movement.quantity)) {
            throw new Error("La cantidad del movimiento debe ser un número")
        }
        return stock + movement.quantity
    }, 0)

// El usuario carga siempre una cantidad positiva: el signo lo decide el tipo de
// movimiento, nunca lo que escribe.
export const resolveMovementQuantity = (
    type: ManualMovementType,
    quantity: number,
    direction: MovementDirection,
): number => {
    if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("La cantidad debe ser un número mayor a 0")
    }

    if (type === "waste") return -quantity

    return direction === "in" ? quantity : -quantity
}

export const isBelowMinimum = (currentStock: number, minStock: number): boolean =>
    currentStock < minStock

// Una venta puede dejar el stock en negativo: no se bloquea el cobro, se muestra.
export const isNegativeStock = (currentStock: number): boolean => currentStock < 0

// Un solo estado para pintar la fila/tarjeta: negativo pesa más que bajo mínimo, nunca
// se muestran los dos badges a la vez (ver StockBadge en stock-table.component.tsx).
export const resolveStockStatus = (currentStock: number, minStock: number): StockStatus => {
    if (isNegativeStock(currentStock)) return "negative"
    if (isBelowMinimum(currentStock, minStock)) return "low"
    return "ok"
}
