import { describe, expect, it } from "vitest"
import { isPreparedWithoutCost } from "./isPreparedWithoutCost.service"

describe("isPreparedWithoutCost", () => {
    it("un insumo comprado nunca está \"sin producción\", tenga o no costo", () => {
        expect(isPreparedWithoutCost({ origin: "purchased", last_production_unit_cost: null })).toBe(false)
    })

    it("un preparado con al menos una producción tiene costo", () => {
        expect(isPreparedWithoutCost({ origin: "produced", last_production_unit_cost: 320 })).toBe(false)
    })

    it("un preparado con costo $0 en su última producción sigue teniendo costo real", () => {
        expect(isPreparedWithoutCost({ origin: "produced", last_production_unit_cost: 0 })).toBe(false)
    })

    it("un preparado que nunca se produjo está sin costo", () => {
        expect(isPreparedWithoutCost({ origin: "produced", last_production_unit_cost: null })).toBe(true)
    })
})
