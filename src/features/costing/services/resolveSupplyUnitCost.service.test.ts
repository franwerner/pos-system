import { describe, expect, it } from "vitest"
import { NO_TAXES, type TaxContext } from "@/features/taxes/types/tax.type"
import { resolveSupplyUnitCost } from "./resolveSupplyUnitCost.service"

const recoverableVat: TaxContext = { ...NO_TAXES, purchase_rate: 21 }

describe("resolveSupplyUnitCost", () => {
    const carne = {
        origin: "purchased" as const,
        purchase_price: 12100,
        yield_factor: 0.85,
        last_production_unit_cost: null,
    }

    it("sin impuestos de compra el costo es el precio pagado dividido el rendimiento", () => {
        expect(resolveSupplyUnitCost(carne, NO_TAXES)).toBeCloseTo(12100 / 0.85, 10)
    })

    it("con un impuesto de compra recuperable netea el precio antes de aplicar el rendimiento", () => {
        expect(resolveSupplyUnitCost(carne, recoverableVat)).toBeCloseTo(10000 / 0.85, 10)
    })

    it("un preparado vale lo que dejó su última producción, sin impuesto que descontar", () => {
        const milanesa = {
            origin: "produced" as const,
            purchase_price: 0,
            yield_factor: 1,
            last_production_unit_cost: 320,
        }

        expect(resolveSupplyUnitCost(milanesa, NO_TAXES)).toBe(320)
        expect(resolveSupplyUnitCost(milanesa, recoverableVat)).toBe(320)
    })

    it("un preparado que nunca se produjo vale 0", () => {
        expect(resolveSupplyUnitCost({
            origin: "produced",
            purchase_price: 0,
            yield_factor: 1,
            last_production_unit_cost: null,
        }, recoverableVat)).toBe(0)
    })
})
