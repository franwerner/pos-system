import { describe, expect, it } from "vitest"
import { NO_TAXES, type TaxContext } from "@/features/taxes/types/tax.type"
import { calculateSuggestedPrice } from "./calculateSuggestedPrice.service"

describe("calculateSuggestedPrice", () => {
    it("sin impuestos sobre la venta el sugerido es el costo dividido lo que no es margen", () => {
        expect(calculateSuggestedPrice({
            totalCost: 3500,
            targetMarginPercentage: 65,
            tax: NO_TAXES,
        })).toBeCloseTo(10000, 10)
    })

    it("suma al sugerido lo que el precio va a perder en impuestos y comisiones", () => {
        const tax: TaxContext = { ...NO_TAXES, sale_rate: 21, payment_rate: 3 }

        expect(calculateSuggestedPrice({
            totalCost: 3500,
            targetMarginPercentage: 65,
            tax,
        })).toBeCloseTo(10000 * 1.24, 10)
    })

    it("con margen 0 el sugerido apenas cubre el costo", () => {
        expect(calculateSuggestedPrice({
            totalCost: 3500,
            targetMarginPercentage: 0,
            tax: NO_TAXES,
        })).toBe(3500)
    })

    it("sin margen objetivo no hay precio sugerido", () => {
        expect(calculateSuggestedPrice({
            totalCost: 3500,
            targetMarginPercentage: null,
            tax: NO_TAXES,
        })).toBeNull()
    })

    it("rechaza un costo negativo y un margen fuera de rango", () => {
        expect(() => calculateSuggestedPrice({
            totalCost: -1,
            targetMarginPercentage: 65,
            tax: NO_TAXES,
        })).toThrowError(/costo total/)

        expect(() => calculateSuggestedPrice({
            totalCost: 3500,
            targetMarginPercentage: 100,
            tax: NO_TAXES,
        })).toThrowError(/margen objetivo/)
    })
})
