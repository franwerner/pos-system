import { describe, expect, it } from "vitest"
import { calculateSaleConsumption } from "@/features/stock/services/calculateSaleConsumption.service"
import { revertStockMovements } from "./revertStockMovements.service"

describe("revertStockMovements", () => {
    it("devuelve el movimiento espejo de cada consumo", () => {
        const reversal = revertStockMovements([
            { supply_id: 1, quantity: -3, unit_cost: 120 },
            { supply_id: 2, quantity: -0.5, unit_cost: 800 },
        ])

        expect(reversal).toEqual([
            { supply_id: 1, quantity: 3, unit_cost: 120 },
            { supply_id: 2, quantity: 0.5, unit_cost: 800 },
        ])
    })

    it("el stock vuelve a como estaba: consumo más reversión suman cero", () => {
        const consumption = calculateSaleConsumption(
            [{ product_id: 1, quantity: 2 }],
            [
                { product_id: 1, supply_id: 10, quantity: 1.5, unit_cost: 100 },
                { product_id: 1, supply_id: 11, quantity: 1, unit_cost: 50 },
            ],
        )

        const reversal = revertStockMovements(consumption)

        const netBySupply = [...consumption, ...reversal].reduce<Record<number, number>>(
            (net, movement) => ({
                ...net,
                [movement.supply_id]: (net[movement.supply_id] ?? 0) + movement.quantity,
            }),
            {},
        )

        expect(netBySupply).toEqual({ 10: 0, 11: 0 })
    })

    it("un movimiento en cero no genera reversión", () => {
        expect(revertStockMovements([{ supply_id: 1, quantity: 0, unit_cost: 10 }])).toEqual([])
    })

    it("una venta sin movimientos no revierte nada", () => {
        expect(revertStockMovements([])).toEqual([])
    })

    it("también revierte un ingreso, no solo un consumo", () => {
        expect(revertStockMovements([{ supply_id: 4, quantity: 7, unit_cost: 30 }]))
            .toEqual([{ supply_id: 4, quantity: -7, unit_cost: 30 }])
    })

    it("rechaza una cantidad que no es un número", () => {
        expect(() => revertStockMovements([{ supply_id: 1, quantity: Number.NaN, unit_cost: 10 }]))
            .toThrowError(/número/)
    })
})
