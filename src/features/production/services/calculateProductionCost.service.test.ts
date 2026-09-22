import { describe, expect, it } from "vitest"
import {
    calculateProductionConsumption,
    calculateProductionCost,
    calculateProductionUnitCost,
    resolveComponentCost,
    type ProductionComponentLine,
} from "./calculateProductionCost.service"

const milanesa: ProductionComponentLine[] = [
    { supply_id: 1, quantity: 100, unit_cost: 12 },
    { supply_id: 2, quantity: 30, unit_cost: 4 },
    { supply_id: 3, quantity: 1, unit_cost: 25 },
]

describe("resolveComponentCost", () => {
    it("usa precio de compra dividido rendimiento para un componente comprado", () => {
        expect(resolveComponentCost({
            origin: "purchased",
            purchase_price: 10.5,
            yield_factor: 0.5,
            last_production_unit_cost: 999,
        })).toBe(21)
    })

    it("usa el costo de la última producción para un componente preparado", () => {
        expect(resolveComponentCost({
            origin: "produced",
            purchase_price: 10.5,
            yield_factor: 0.5,
            last_production_unit_cost: 320,
        })).toBe(320)
    })

    it("cuesta 0 el preparado que todavía no se produjo nunca", () => {
        expect(resolveComponentCost({
            origin: "produced",
            purchase_price: 0,
            yield_factor: 1,
            last_production_unit_cost: null,
        })).toBe(0)
    })
})

describe("calculateProductionConsumption", () => {
    it("descuenta la composición de cada componente", () => {
        expect(calculateProductionConsumption(milanesa, 1)).toEqual([
            { supply_id: 1, quantity: -100, unit_cost: 12 },
            { supply_id: 2, quantity: -30, unit_cost: 4 },
            { supply_id: 3, quantity: -1, unit_cost: 25 },
        ])
    })

    it("multiplica cada consumo por las unidades producidas", () => {
        expect(calculateProductionConsumption(milanesa, 12)).toEqual([
            { supply_id: 1, quantity: -1200, unit_cost: 12 },
            { supply_id: 2, quantity: -360, unit_cost: 4 },
            { supply_id: 3, quantity: -12, unit_cost: 25 },
        ])
    })

    it("rechaza cantidades producidas que no son números mayores a 0", () => {
        expect(() => calculateProductionConsumption(milanesa, 0))
            .toThrowError(/cantidad producida/)
        expect(() => calculateProductionConsumption(milanesa, Number.NaN))
            .toThrowError(/cantidad producida/)
    })

    it("rechaza componentes con cantidad o costo inválidos", () => {
        expect(() => calculateProductionConsumption([{ supply_id: 1, quantity: 0, unit_cost: 5 }], 1))
            .toThrowError(/cantidad del componente/)
        expect(() => calculateProductionConsumption([{ supply_id: 1, quantity: 5, unit_cost: -1 }], 1))
            .toThrowError(/costo del componente/)
    })
})

describe("calculateProductionUnitCost", () => {
    it("suma el costo de varios componentes de una unidad", () => {
        expect(calculateProductionCost(milanesa, 1)).toBe(1345)
        expect(calculateProductionUnitCost(milanesa, 1)).toBe(1345)
    })

    it("mantiene el costo unitario al producir más unidades", () => {
        expect(calculateProductionCost(milanesa, 10)).toBe(13450)
        expect(calculateProductionUnitCost(milanesa, 10)).toBe(1345)
    })

    it("costea un componente que a su vez es preparado con el costo de su última producción", () => {
        const empanada: ProductionComponentLine[] = [
            {
                supply_id: 1,
                quantity: 2,
                unit_cost: resolveComponentCost({
                    origin: "produced",
                    purchase_price: 0,
                    yield_factor: 1,
                    last_production_unit_cost: 150,
                }),
            },
            {
                supply_id: 2,
                quantity: 50,
                unit_cost: resolveComponentCost({
                    origin: "purchased",
                    purchase_price: 8,
                    yield_factor: 0.8,
                    last_production_unit_cost: null,
                }),
            },
        ]

        expect(calculateProductionUnitCost(empanada, 4)).toBe(800)
    })

    it("cuesta 0 el preparado cuyo único componente todavía no tiene costo", () => {
        expect(calculateProductionUnitCost([{ supply_id: 1, quantity: 3, unit_cost: 0 }], 2)).toBe(0)
    })
})
