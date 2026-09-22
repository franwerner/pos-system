import { describe, expect, it } from "vitest"
import { calculateSupplyCost } from "./calculateSupplyCost.service"

describe("calculateSupplyCost", () => {
    it("devuelve el precio de compra cuando el rendimiento es 1", () => {
        expect(calculateSupplyCost(1500, 1)).toBe(1500)
    })

    it("encarece el insumo cuando el rendimiento es parcial", () => {
        expect(calculateSupplyCost(1500, 0.75)).toBe(2000)
    })

    it("soporta rendimientos con tres decimales", () => {
        expect(calculateSupplyCost(2400, 0.875)).toBeCloseTo(2742.857, 3)
    })

    it("rechaza el rendimiento 0 en vez de dividir por cero", () => {
        expect(() => calculateSupplyCost(1500, 0)).toThrowError(/rendimiento/)
    })

    it("rechaza rendimientos negativos y no numéricos", () => {
        expect(() => calculateSupplyCost(1500, -1)).toThrowError(/rendimiento/)
        expect(() => calculateSupplyCost(1500, Number.NaN)).toThrowError(/rendimiento/)
    })

    it("rechaza precios de compra negativos", () => {
        expect(() => calculateSupplyCost(-10, 1)).toThrowError(/precio de compra/)
    })

    it("acepta el precio de compra 0", () => {
        expect(calculateSupplyCost(0, 0.5)).toBe(0)
    })
})
