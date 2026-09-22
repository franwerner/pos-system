import { describe, expect, it } from "vitest"
import {
    calculateWastePercentage,
    type CostedMovement,
} from "./calculateWastePercentage.service"

const ESTIMATED = 4

const consumption: CostedMovement[] = [
    { type: "sale", quantity: -150, unit_cost: 12 },
    { type: "production_out", quantity: -100, unit_cost: 8 },
]

describe("calculateWastePercentage", () => {
    it("mide la merma del mes contra los insumos consumidos", () => {
        const movements: CostedMovement[] = [
            ...consumption,
            { type: "waste", quantity: -20, unit_cost: 13 },
        ]

        expect(calculateWastePercentage(movements, ESTIMATED)).toEqual({
            percentage: 10,
            waste_cost: 260,
            consumption_cost: 2600,
            basis: "real",
        })
    })

    it("informa 0 cuando el mes tuvo consumo y ninguna merma", () => {
        expect(calculateWastePercentage(consumption, ESTIMATED)).toEqual({
            percentage: 0,
            waste_cost: 0,
            consumption_cost: 2600,
            basis: "real",
        })
    })

    it("cae en el porcentaje estimado cuando el mes no tiene consumo registrado", () => {
        const movements: CostedMovement[] = [{ type: "waste", quantity: -5, unit_cost: 40 }]

        expect(calculateWastePercentage(movements, ESTIMATED)).toEqual({
            percentage: ESTIMATED,
            waste_cost: 200,
            consumption_cost: 0,
            basis: "estimated",
        })
    })

    it("cae en el porcentaje estimado cuando el mes no tiene ningún movimiento", () => {
        expect(calculateWastePercentage([], ESTIMATED)).toEqual({
            percentage: ESTIMATED,
            waste_cost: 0,
            consumption_cost: 0,
            basis: "estimated",
        })
    })

    it("no cuenta como merma un ajuste negativo", () => {
        const movements: CostedMovement[] = [
            ...consumption,
            { type: "adjustment", quantity: -30, unit_cost: 12 },
        ]

        expect(calculateWastePercentage(movements, ESTIMATED)).toMatchObject({
            percentage: 0,
            waste_cost: 0,
            basis: "real",
        })
    })

    it("ignora las entradas de stock al medir el consumo", () => {
        const movements: CostedMovement[] = [
            ...consumption,
            { type: "purchase", quantity: 500, unit_cost: 12 },
            { type: "production_in", quantity: 10, unit_cost: 80 },
            { type: "waste", quantity: -20, unit_cost: 13 },
        ]

        expect(calculateWastePercentage(movements, ESTIMATED)).toMatchObject({
            consumption_cost: 2600,
            percentage: 10,
        })
    })

    it("rechaza movimientos y porcentajes estimados inválidos", () => {
        expect(() => calculateWastePercentage([{ type: "waste", quantity: Number.NaN, unit_cost: 1 }], ESTIMATED))
            .toThrowError(/cantidad del movimiento/)
        expect(() => calculateWastePercentage([{ type: "sale", quantity: -1, unit_cost: -1 }], ESTIMATED))
            .toThrowError(/costo del movimiento/)
        expect(() => calculateWastePercentage([], -1)).toThrowError(/merma estimada/)
    })
})
