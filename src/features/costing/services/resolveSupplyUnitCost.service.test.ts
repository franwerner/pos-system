import { describe, expect, it } from "vitest"
import { resolveSupplyUnitCost } from "./resolveSupplyUnitCost.service"

describe("resolveSupplyUnitCost", () => {
    const carne = {
        origin: "purchased" as const,
        purchase_price: 12100,
        yield_factor: 0.85,
        last_production_unit_cost: null,
    }

    it("el costo es el precio pagado dividido el rendimiento, sin netear impuestos", () => {
        expect(resolveSupplyUnitCost(carne)).toBeCloseTo(12100 / 0.85, 10)
    })

    it("un preparado vale lo que dejó su última producción", () => {
        const milanesa = {
            origin: "produced" as const,
            purchase_price: 0,
            yield_factor: 1,
            last_production_unit_cost: 320,
        }

        expect(resolveSupplyUnitCost(milanesa)).toBe(320)
    })

    it("un preparado que nunca se produjo vale 0", () => {
        expect(resolveSupplyUnitCost({
            origin: "produced",
            purchase_price: 0,
            yield_factor: 1,
            last_production_unit_cost: null,
        })).toBe(0)
    })
})
