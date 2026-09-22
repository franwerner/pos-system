import { describe, expect, it } from "vitest"
import {
    isBelowMinimum,
    resolveMovementQuantity,
    sumStockMovements,
} from "./calculateStock.service"

describe("sumStockMovements", () => {
    it("un insumo sin movimientos tiene stock 0", () => {
        expect(sumStockMovements([])).toBe(0)
    })

    it("suma entradas y salidas mezcladas", () => {
        const movements = [
            { quantity: 5000 },
            { quantity: -1200 },
            { quantity: 800 },
            { quantity: -300 },
        ]

        expect(sumStockMovements(movements)).toBe(4300)
    })

    it("deja el stock en negativo cuando las salidas superan a las entradas", () => {
        expect(sumStockMovements([{ quantity: 10 }, { quantity: -25 }])).toBe(-15)
    })

    it("soporta cantidades con tres decimales", () => {
        expect(sumStockMovements([{ quantity: 1.5 }, { quantity: -0.25 }])).toBeCloseTo(1.25, 3)
    })

    it("rechaza cantidades no numéricas", () => {
        expect(() => sumStockMovements([{ quantity: Number.NaN }])).toThrowError(/número/)
    })
})

describe("resolveMovementQuantity", () => {
    it("la merma siempre resta, sin importar la dirección elegida", () => {
        expect(resolveMovementQuantity("waste", 250, "in")).toBe(-250)
        expect(resolveMovementQuantity("waste", 250, "out")).toBe(-250)
    })

    it("el ajuste respeta el signo elegido", () => {
        expect(resolveMovementQuantity("adjustment", 40, "in")).toBe(40)
        expect(resolveMovementQuantity("adjustment", 40, "out")).toBe(-40)
    })

    it("rechaza cantidades que no son mayores a 0", () => {
        expect(() => resolveMovementQuantity("waste", 0, "out")).toThrowError(/mayor a 0/)
        expect(() => resolveMovementQuantity("adjustment", -5, "in")).toThrowError(/mayor a 0/)
        expect(() => resolveMovementQuantity("waste", Number.NaN, "out")).toThrowError(/mayor a 0/)
    })

    it("el stock resultante es la suma de los movimientos que resuelve", () => {
        const movements = [
            { quantity: resolveMovementQuantity("adjustment", 100, "in") },
            { quantity: resolveMovementQuantity("waste", 30, "out") },
            { quantity: resolveMovementQuantity("adjustment", 20, "out") },
        ]

        expect(sumStockMovements(movements)).toBe(50)
    })
})

describe("isBelowMinimum", () => {
    it("marca el insumo cuando el stock no llega al mínimo", () => {
        expect(isBelowMinimum(1200, 2000)).toBe(true)
    })

    it("no marca el insumo cuando el stock iguala o supera el mínimo", () => {
        expect(isBelowMinimum(2000, 2000)).toBe(false)
        expect(isBelowMinimum(2500, 2000)).toBe(false)
    })
})
