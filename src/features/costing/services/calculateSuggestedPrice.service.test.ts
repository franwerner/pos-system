import { describe, expect, it } from "vitest"
import { calculateSuggestedPrice } from "./calculateSuggestedPrice.service"

describe("calculateSuggestedPrice", () => {
    it("el sugerido es el costo variable dividido lo que no es margen", () => {
        expect(calculateSuggestedPrice({
            variableCost: 3500,
            targetMarginPercentage: 65,
        })).toBeCloseTo(10000, 10)
    })

    it("ejemplo de referencia: insumos + merma 3300, margen 70% → sugerido = variable / 0,3", () => {
        expect(calculateSuggestedPrice({
            variableCost: 3300,
            targetMarginPercentage: 70,
        })).toBeCloseTo(3300 / 0.3, 10)
    })

    it("con margen 0 el sugerido apenas cubre los insumos", () => {
        expect(calculateSuggestedPrice({
            variableCost: 3500,
            targetMarginPercentage: 0,
        })).toBe(3500)
    })

    it("sin margen objetivo no hay precio sugerido", () => {
        expect(calculateSuggestedPrice({
            variableCost: 3500,
            targetMarginPercentage: null,
        })).toBeNull()
    })

    it("rechaza un costo negativo y un margen fuera de rango", () => {
        expect(() => calculateSuggestedPrice({
            variableCost: -1,
            targetMarginPercentage: 65,
        })).toThrowError(/costo variable/)

        expect(() => calculateSuggestedPrice({
            variableCost: 3500,
            targetMarginPercentage: 100,
        })).toThrowError(/margen objetivo/)
    })
})
