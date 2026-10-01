import { describe, expect, it } from "vitest"
import { calculateWasteByType, type TypedCostedMovement } from "./calculateWasteByType.service"

const ESTIMATED = { food: 4, drink: 1, packaging: 0 }

const movements: TypedCostedMovement[] = [
    { supply_type: "food", type: "sale", quantity: -150, unit_cost: 12 },
    { supply_type: "food", type: "production_out", quantity: -100, unit_cost: 8 },
    { supply_type: "food", type: "waste", quantity: -20, unit_cost: 13 },
    { supply_type: "drink", type: "sale", quantity: -10, unit_cost: 950 },
    { supply_type: "drink", type: "waste", quantity: -1, unit_cost: 950 },
]

describe("calculateWasteByType", () => {
    it("mide cada tipo contra su propio consumo", () => {
        const measured = calculateWasteByType(movements, ESTIMATED)

        expect(measured.food).toEqual({
            percentage: 10,
            waste_cost: 260,
            consumption_cost: 2600,
            basis: "real",
        })
        expect(measured.drink).toEqual({
            percentage: 10,
            waste_cost: 950,
            consumption_cost: 9500,
            basis: "real",
        })
    })

    it("no mezcla la pérdida de un tipo con el consumo de otro", () => {
        const measured = calculateWasteByType([
            { supply_type: "food", type: "sale", quantity: -100, unit_cost: 10 },
            { supply_type: "packaging", type: "waste", quantity: -5, unit_cost: 120 },
        ], ESTIMATED)

        expect(measured.food.percentage).toBe(0)
        expect(measured.packaging.waste_cost).toBe(600)
        expect(measured.packaging.consumption_cost).toBe(0)
    })

    it("informa el porcentaje declarado del tipo que no tuvo consumo", () => {
        const measured = calculateWasteByType(movements, ESTIMATED)

        expect(measured.packaging).toEqual({
            percentage: 0,
            waste_cost: 0,
            consumption_cost: 0,
            basis: "estimated",
        })
    })

    it("cubre siempre los tres tipos, aunque el período no tenga movimientos", () => {
        const measured = calculateWasteByType([], ESTIMATED)

        expect(Object.keys(measured).sort()).toEqual(["drink", "food", "packaging"])
        expect(measured.food).toEqual({
            percentage: 4,
            waste_cost: 0,
            consumption_cost: 0,
            basis: "estimated",
        })
        expect(measured.drink.percentage).toBe(1)
    })

    it("un ajuste negativo no cuenta como pérdida en ningún tipo", () => {
        const measured = calculateWasteByType([
            { supply_type: "food", type: "sale", quantity: -100, unit_cost: 10 },
            { supply_type: "food", type: "adjustment", quantity: -30, unit_cost: 10 },
        ], ESTIMATED)

        expect(measured.food.waste_cost).toBe(0)
        expect(measured.food.percentage).toBe(0)
    })
})
