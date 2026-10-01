import { describe, expect, it } from "vitest"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import {
    adjustmentLabel,
    describePaymentAdjustmentNote,
    formatAdjustmentPercentage,
    getAdjustmentKind,
} from "./describeAdjustment.service"

describe("getAdjustmentKind", () => {
    it("un ajuste negativo es un descuento", () => {
        expect(getAdjustmentKind(-10)).toBe("descuento")
    })

    it("un ajuste positivo es un recargo", () => {
        expect(getAdjustmentKind(18)).toBe("recargo")
    })

    it("sin ajuste es precio de lista", () => {
        expect(getAdjustmentKind(0)).toBe("lista")
    })
})

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

describe("describePaymentAdjustmentNote", () => {
    it("arma la nota completa de un descuento", () => {
        expect(describePaymentAdjustmentNote(-10, -1000)).toBe(`Descuento -10%: ${formatCurrency(-1000)}`)
    })

    it("arma la nota completa de un recargo", () => {
        expect(describePaymentAdjustmentNote(18, 2160)).toBe(`Recargo +18%: ${formatCurrency(2160)}`)
    })

    it("sin ajuste configurado no hay nada que aclarar", () => {
        expect(describePaymentAdjustmentNote(0, 0)).toBeUndefined()
    })
})
