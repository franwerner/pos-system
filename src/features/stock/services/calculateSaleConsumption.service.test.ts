import { describe, expect, it } from "vitest"
import {
    calculateSaleConsumption,
    findStockShortages,
    type ProductCompositionLine,
} from "./calculateSaleConsumption.service"

const burger: ProductCompositionLine[] = [
    { product_id: 1, supply_id: 10, quantity: 150, unit_cost: 12 },
    { product_id: 1, supply_id: 20, quantity: 1, unit_cost: 120 },
    { product_id: 1, supply_id: 30, quantity: 2, unit_cost: 40 },
]

const fries: ProductCompositionLine[] = [
    { product_id: 2, supply_id: 40, quantity: 200, unit_cost: 3 },
    { product_id: 2, supply_id: 20, quantity: 1, unit_cost: 120 },
]

describe("calculateSaleConsumption", () => {
    it("descuenta cada insumo de la composición de un producto", () => {
        expect(calculateSaleConsumption([{ product_id: 1, quantity: 1 }], burger)).toEqual([
            { supply_id: 10, quantity: -150, unit_cost: 12 },
            { supply_id: 20, quantity: -1, unit_cost: 120 },
            { supply_id: 30, quantity: -2, unit_cost: 40 },
        ])
    })

    it("multiplica la composición por la cantidad vendida", () => {
        expect(calculateSaleConsumption([{ product_id: 1, quantity: 3 }], burger)).toEqual([
            { supply_id: 10, quantity: -450, unit_cost: 12 },
            { supply_id: 20, quantity: -3, unit_cost: 120 },
            { supply_id: 30, quantity: -6, unit_cost: 40 },
        ])
    })

    it("no genera ningún movimiento para un producto sin composición", () => {
        expect(calculateSaleConsumption([{ product_id: 99, quantity: 5 }], burger)).toEqual([])
    })

    it("acumula el insumo que comparten dos productos en un solo movimiento", () => {
        const consumption = calculateSaleConsumption(
            [{ product_id: 1, quantity: 2 }, { product_id: 2, quantity: 3 }],
            [...burger, ...fries],
        )

        expect(consumption).toEqual([
            { supply_id: 10, quantity: -300, unit_cost: 12 },
            { supply_id: 20, quantity: -5, unit_cost: 120 },
            { supply_id: 30, quantity: -4, unit_cost: 40 },
            { supply_id: 40, quantity: -600, unit_cost: 3 },
        ])
    })

    it("ignora los productos sin composición dentro de un carrito mixto", () => {
        const consumption = calculateSaleConsumption(
            [{ product_id: 99, quantity: 4 }, { product_id: 2, quantity: 1 }],
            [...burger, ...fries],
        )

        expect(consumption).toEqual([
            { supply_id: 40, quantity: -200, unit_cost: 3 },
            { supply_id: 20, quantity: -1, unit_cost: 120 },
        ])
    })

    it("rechaza cantidades vendidas que no son números mayores a 0", () => {
        expect(() => calculateSaleConsumption([{ product_id: 1, quantity: 0 }], burger))
            .toThrowError(/cantidad vendida/)
        expect(() => calculateSaleConsumption([{ product_id: 1, quantity: Number.NaN }], burger))
            .toThrowError(/cantidad vendida/)
    })

    it("rechaza cantidades de composición que no son números mayores a 0", () => {
        expect(() => calculateSaleConsumption(
            [{ product_id: 1, quantity: 1 }],
            [{ product_id: 1, supply_id: 10, quantity: -5, unit_cost: 12 }],
        )).toThrowError(/composición/)
    })
})

describe("findStockShortages", () => {
    it("marca solo los insumos cuyo stock no alcanza", () => {
        const consumption = calculateSaleConsumption([{ product_id: 1, quantity: 2 }], burger)

        expect(findStockShortages(consumption, [
            { supply_id: 10, current_stock: 100 },
            { supply_id: 20, current_stock: 10 },
            { supply_id: 30, current_stock: 4 },
        ])).toEqual([
            { supply_id: 10, required: 300, available: 100 },
        ])
    })

    it("trata un insumo sin movimientos como stock 0", () => {
        expect(findStockShortages([{ supply_id: 10, quantity: -5, unit_cost: 1 }], []))
            .toEqual([{ supply_id: 10, required: 5, available: 0 }])
    })

    it("no marca faltante cuando el stock iguala lo requerido", () => {
        expect(findStockShortages(
            [{ supply_id: 10, quantity: -5, unit_cost: 1 }],
            [{ supply_id: 10, current_stock: 5 }],
        )).toEqual([])
    })
})
