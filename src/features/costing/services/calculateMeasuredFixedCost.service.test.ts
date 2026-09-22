import { describe, expect, it } from "vitest"
import { calculateMeasuredFixedCost } from "./calculateMeasuredFixedCost.service"

describe("calculateMeasuredFixedCost", () => {
    it("reparte los costos fijos del único mes cerrado entre sus unidades vendidas", () => {
        expect(calculateMeasuredFixedCost([
            { month: "2026-08", fixedCostTotal: 470000, soldUnits: 200 },
        ])).toEqual({
            confidence: "single_month",
            months: ["2026-08"],
            fixed_cost_total: 470000,
            sold_units: 200,
            amount_per_unit: 2350,
        })
    })

    it("promedia el costo por unidad de todos los meses cerrados disponibles", () => {
        const measured = calculateMeasuredFixedCost([
            { month: "2026-08", fixedCostTotal: 470000, soldUnits: 200 },
            { month: "2026-07", fixedCostTotal: 300000, soldUnits: 100 },
        ])

        expect(measured.confidence).toBe("averaged")
        expect(measured.months).toEqual(["2026-07", "2026-08"])
        expect(measured.amount_per_unit).toBe((2350 + 3000) / 2)
        expect(measured.fixed_cost_total).toBe(385000)
        expect(measured.sold_units).toBe(150)
    })

    it("deja afuera un mes cerrado sin ventas en vez de dividir por cero", () => {
        const measured = calculateMeasuredFixedCost([
            { month: "2026-08", fixedCostTotal: 470000, soldUnits: 200 },
            { month: "2026-07", fixedCostTotal: 300000, soldUnits: 0 },
        ])

        expect(measured.confidence).toBe("single_month")
        expect(measured.months).toEqual(["2026-08"])
        expect(measured.amount_per_unit).toBe(2350)
    })

    it("queda preliminar cuando no hay ningún mes cerrado con ventas", () => {
        expect(calculateMeasuredFixedCost([])).toEqual({
            confidence: "preliminary",
            months: [],
            fixed_cost_total: 0,
            sold_units: 0,
            amount_per_unit: 0,
        })

        expect(calculateMeasuredFixedCost([
            { month: "2026-08", fixedCostTotal: 470000, soldUnits: 0 },
        ]).confidence).toBe("preliminary")
    })

    it("reparte 0 cuando el mes cerrado no tuvo costos fijos cargados", () => {
        expect(calculateMeasuredFixedCost([
            { month: "2026-08", fixedCostTotal: 0, soldUnits: 200 },
        ])).toMatchObject({ confidence: "single_month", amount_per_unit: 0 })
    })

    it("rechaza totales y unidades inválidas", () => {
        expect(() => calculateMeasuredFixedCost([
            { month: "2026-08", fixedCostTotal: -1, soldUnits: 200 },
        ])).toThrowError(/costos fijos/)

        expect(() => calculateMeasuredFixedCost([
            { month: "2026-08", fixedCostTotal: 470000, soldUnits: Number.NaN },
        ])).toThrowError(/unidades vendidas/)
    })
})
