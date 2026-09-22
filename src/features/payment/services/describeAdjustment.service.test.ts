import { describe, expect, it } from "vitest"
import { adjustmentLabel, formatAdjustmentPercentage } from "./describeAdjustment.service"

describe("adjustmentLabel", () => {
    it("un ajuste negativo es un descuento", () => {
        expect(adjustmentLabel(-750)).toBe("Descuento")
        expect(adjustmentLabel(-750, true)).toBe("Descuentos")
    })

    it("un ajuste positivo es un recargo", () => {
        expect(adjustmentLabel(750)).toBe("Recargo")
        expect(adjustmentLabel(750, true)).toBe("Recargos")
    })

    it("sin ajuste el nombre no toma partido", () => {
        expect(adjustmentLabel(0)).toBe("Ajuste")
        expect(adjustmentLabel(0, true)).toBe("Ajustes")
    })
})

describe("formatAdjustmentPercentage", () => {
    it("el recargo lleva el signo más adelante", () => {
        expect(formatAdjustmentPercentage(10)).toBe("+10%")
    })

    it("el descuento conserva su signo menos", () => {
        expect(formatAdjustmentPercentage(-10)).toBe("-10%")
    })

    it("el cero va sin signo", () => {
        expect(formatAdjustmentPercentage(0)).toBe("0%")
    })
})
