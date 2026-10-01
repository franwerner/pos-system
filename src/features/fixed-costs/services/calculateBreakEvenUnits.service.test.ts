import { describe, expect, it } from "vitest"
import { calculateBreakEvenUnits } from "./calculateBreakEvenUnits.service"

describe("calculateBreakEvenUnits", () => {
    it("divide los costos fijos por el margen promedio de la carta", () => {
        const breakEven = calculateBreakEvenUnits({
            fixedCostTotal: 900000,
            contributionMargins: [3000, 5000, 4000],
        })

        expect(breakEven.status).toBe("ok")
        expect(breakEven.average_contribution_margin).toBe(4000)
        expect(breakEven.units).toBe(225)
    })

    it("redondea para arriba: la unidad que falta para llegar se vende entera", () => {
        const breakEven = calculateBreakEvenUnits({
            fixedCostTotal: 10000,
            contributionMargins: [3000],
        })

        expect(breakEven.units).toBe(4)
    })

    it("sin productos costeables no hay número que dar", () => {
        const breakEven = calculateBreakEvenUnits({
            fixedCostTotal: 900000,
            contributionMargins: [],
        })

        expect(breakEven.status).toBe("no_costable_products")
        expect(breakEven.units).toBeNull()
    })

    it("con margen promedio cero no divide por cero: ninguna cantidad cubre los fijos", () => {
        const breakEven = calculateBreakEvenUnits({
            fixedCostTotal: 900000,
            contributionMargins: [-2000, 2000],
        })

        expect(breakEven.status).toBe("no_contribution")
        expect(breakEven.average_contribution_margin).toBe(0)
        expect(breakEven.units).toBeNull()
    })

    it("con margen promedio negativo tampoco hay cantidad que alcance", () => {
        const breakEven = calculateBreakEvenUnits({
            fixedCostTotal: 900000,
            contributionMargins: [-1000, -3000],
        })

        expect(breakEven.status).toBe("no_contribution")
        expect(breakEven.average_contribution_margin).toBe(-2000)
        expect(breakEven.units).toBeNull()
    })

    it("sin costos fijos cargados no hay nada que cubrir", () => {
        const breakEven = calculateBreakEvenUnits({
            fixedCostTotal: 0,
            contributionMargins: [4000],
        })

        expect(breakEven.status).toBe("ok")
        expect(breakEven.units).toBe(0)
    })

    it("rechaza un total negativo y un margen que no es número", () => {
        expect(() => calculateBreakEvenUnits({
            fixedCostTotal: -1,
            contributionMargins: [4000],
        })).toThrowError(/total de costos fijos/)

        expect(() => calculateBreakEvenUnits({
            fixedCostTotal: 900000,
            contributionMargins: [Number.NaN],
        })).toThrowError(/margen de contribución/)
    })
})
