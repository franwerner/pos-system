import { describe, expect, it } from "vitest"
import {
    calculateLineAmount,
    calculatePurchaseTotal,
} from "./calculatePurchaseTotal.service"

describe("calculateLineAmount", () => {
    it("multiplica cantidad por precio unitario", () => {
        expect(calculateLineAmount({ quantity: 3, unit_price: 900 })).toBe(2700)
    })

    it("acepta el precio unitario 0", () => {
        expect(calculateLineAmount({ quantity: 2, unit_price: 0 })).toBe(0)
    })

    it("rechaza cantidades que no son mayores a 0", () => {
        expect(() => calculateLineAmount({ quantity: 0, unit_price: 100 })).toThrowError(/cantidad/)
    })

    it("rechaza precios unitarios negativos", () => {
        expect(() => calculateLineAmount({ quantity: 1, unit_price: -5 })).toThrowError(/precio unitario/)
    })
})

describe("calculatePurchaseTotal", () => {
    it("una compra sin líneas totaliza 0", () => {
        expect(calculatePurchaseTotal([])).toBe(0)
    })

    it("suma el importe de todas las líneas", () => {
        const lines = [
            { quantity: 3, unit_price: 900 },
            { quantity: 5000, unit_price: 9.2 },
        ]

        expect(calculatePurchaseTotal(lines)).toBeCloseTo(48700, 2)
    })
})
