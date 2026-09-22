export type StockMovementLine = {
    supply_id: number
    quantity: number
    unit_cost: number
}

// Cancelar no borra lo que pasó: entra un movimiento espejo que deja el stock como
// estaba y el historial con las dos patas.
export const revertStockMovements = (movements: StockMovementLine[]): StockMovementLine[] =>
    movements
        .filter((movement) => {
            if (!Number.isFinite(movement.quantity)) {
                throw new Error("La cantidad del movimiento debe ser un número")
            }

            return movement.quantity !== 0
        })
        .map((movement) => ({
            supply_id: movement.supply_id,
            quantity: -movement.quantity,
            unit_cost: movement.unit_cost,
        }))
