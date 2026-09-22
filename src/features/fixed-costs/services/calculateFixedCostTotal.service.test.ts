import { describe, expect, it } from "vitest"
import { calculateFixedCostTotal } from "./calculateFixedCostTotal.service"

describe("calculateFixedCostTotal", () => {
    it("suma los montos del mes", () => {
        expect(calculateFixedCostTotal([
            { amount: 350000 },
            { amount: 120000.5 },
            { amount: 0 },
        ])).toBe(470000.5)
    })

    it("devuelve 0 cuando el mes no tiene costos cargados", () => {
        expect(calculateFixedCostTotal([])).toBe(0)
    })

    it("rechaza montos que no son números mayores o iguales a 0", () => {
        expect(() => calculateFixedCostTotal([{ amount: -1 }])).toThrowError(/monto del costo fijo/)
        expect(() => calculateFixedCostTotal([{ amount: Number.NaN }])).toThrowError(/monto del costo fijo/)
    })
})
