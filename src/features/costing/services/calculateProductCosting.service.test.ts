import { describe, expect, it } from "vitest"
import { resolveComponentCost } from "@/features/production/services/calculateProductionCost.service"
import { type CostableProduct, type CostingSupplyLine } from "../types/costing.type"
import {
    buildProductCostings,
    calculateProductCosting,
    type CostingParams,
    type WastePercentages,
} from "./calculateProductCosting.service"

const hamburguesa: CostingSupplyLine[] = [
    { supply_id: 1, name: "Carne picada", type: "food", unit: "gr", quantity: 100, unit_cost: 12 },
    { supply_id: 2, name: "Pan", type: "food", unit: "u", quantity: 1, unit_cost: 300 },
    { supply_id: 3, name: "Bandeja", type: "packaging", unit: "u", quantity: 1, unit_cost: 120 },
    { supply_id: 4, name: "Gaseosa", type: "drink", unit: "u", quantity: 1, unit_cost: 500 },
]

const onlyFoodWaste: WastePercentages = { food: 10, drink: 0, packaging: 0 }

const params: CostingParams = {
    price: 5000,
    wastePercentages: onlyFoodWaste,
    targetMarginPercentage: 65,
}

describe("calculateProductCosting", () => {
    it("suma el costo de varios insumos y lo desglosa por tipo", () => {
        const costing = calculateProductCosting(hamburguesa, params)

        expect(costing?.supplies_cost).toBe(2120)
        expect(costing?.breakdown).toEqual({ food: 1650, packaging: 120, drink: 500 })
    })

    it("aplica a cada línea la merma de su propio tipo de insumo", () => {
        const costing = calculateProductCosting(hamburguesa, {
            ...params,
            wastePercentages: { food: 10, drink: 5, packaging: 2 },
        })

        const [carne, pan, bandeja, gaseosa] = costing!.lines

        expect(carne.waste_cost).toBe(120)
        expect(pan.waste_cost).toBe(30)
        expect(bandeja.waste_cost).toBeCloseTo(2.4, 10)
        expect(gaseosa.waste_cost).toBe(25)
        expect(costing?.waste_cost).toBeCloseTo(177.4, 10)
    })

    it("no castiga al packaging cuando su merma es 0", () => {
        const costing = calculateProductCosting(hamburguesa, params)
        const bandeja = costing!.lines.find((line) => line.type === "packaging")

        expect(bandeja?.waste_cost).toBe(0)
        expect(bandeja?.total_cost).toBe(bandeja?.line_cost)
        expect(costing?.waste_cost).toBe(150)
        expect(costing?.variable_cost).toBe(2270)
    })

    it("costea un producto que incluye un preparado con el costo de su última producción", () => {
        const milanesaAlPan: CostingSupplyLine[] = [
            {
                supply_id: 5,
                name: "Milanesa cruda",
                type: "food",
                unit: "u",
                quantity: 2,
                unit_cost: resolveComponentCost({
                    origin: "produced",
                    purchase_price: 0,
                    yield_factor: 1,
                    last_production_unit_cost: 300,
                }),
            },
            {
                supply_id: 3,
                name: "Bandeja",
                type: "packaging",
                unit: "u",
                quantity: 1,
                unit_cost: 120,
            },
        ]

        const costing = calculateProductCosting(milanesaAlPan, params)

        expect(costing?.breakdown.food).toBe(660)
        expect(costing?.supplies_cost).toBe(720)
        expect(costing?.variable_cost).toBe(780)
    })

    it("'te queda por plato' es el precio de venta menos lo que cuesta hacerlo", () => {
        const costing = calculateProductCosting(hamburguesa, params)

        expect(costing?.variable_cost).toBe(2270)
        expect(costing?.contribution_margin).toBe(2730)
    })

    it("da 'te queda por plato' negativo cuando el precio no cubre lo que cuesta hacerlo", () => {
        const costing = calculateProductCosting(hamburguesa, { ...params, price: 2000 })

        expect(costing?.variable_cost).toBe(2270)
        expect(costing?.contribution_margin).toBe(-270)
    })

    it("no costea un producto sin composición", () => {
        expect(calculateProductCosting([], params)).toBeNull()
    })

    it("rechaza líneas y parámetros inválidos", () => {
        const invalidLine: CostingSupplyLine[] = [{ ...hamburguesa[0], quantity: 0 }]

        expect(() => calculateProductCosting(invalidLine, params))
            .toThrowError(/cantidad de la composición/)
        expect(() => calculateProductCosting(hamburguesa, {
            ...params,
            wastePercentages: { ...onlyFoodWaste, drink: 120 },
        })).toThrowError(/merma/)
        expect(() => calculateProductCosting(hamburguesa, { ...params, price: -1 }))
            .toThrowError(/precio/)
    })
})

describe("el precio sugerido", () => {
    it("es el costo variable llevado al margen objetivo, sin impuestos", () => {
        const costing = calculateProductCosting(hamburguesa, params)

        expect(costing?.variable_cost).toBe(2270)
        expect(costing?.suggested_price).toBeCloseTo(2270 / 0.35, 10)
    })

    // Ejemplo de referencia: insumos + pérdidas de comida (10%) dan un costo variable
    // de 3300 sobre 3000 de insumos; con un margen objetivo del 70% el precio sugerido
    // es ese costo variable dividido 0,3 (lo que no es margen).
    it("ejemplo de referencia: insumos 3000, merma de comida 10%, margen 70% → sugerido = variable / 0,3", () => {
        const lines: CostingSupplyLine[] = [
            { supply_id: 1, name: "Insumo", type: "food", unit: "gr", quantity: 1, unit_cost: 3000 },
        ]

        const costing = calculateProductCosting(lines, {
            price: 12000,
            wastePercentages: { food: 10, drink: 0, packaging: 0 },
            targetMarginPercentage: 70,
        })

        expect(costing?.supplies_cost).toBe(3000)
        expect(costing?.waste_cost).toBe(300)
        expect(costing?.variable_cost).toBe(3300)
        expect(costing?.suggested_price).toBeCloseTo(3300 / 0.3, 10)
        expect(costing?.contribution_margin).toBe(12000 - 3300)
    })

    it("un margen objetivo más alto pide un precio más alto", () => {
        const low = calculateProductCosting(hamburguesa, { ...params, targetMarginPercentage: 40 })
        const high = calculateProductCosting(hamburguesa, { ...params, targetMarginPercentage: 80 })

        expect(high!.suggested_price!).toBeGreaterThan(low!.suggested_price!)
    })

    it("no existe sin margen objetivo: el producto igual se costea", () => {
        const costing = calculateProductCosting(hamburguesa, {
            ...params,
            targetMarginPercentage: null,
        })

        expect(costing?.variable_cost).toBe(2270)
        expect(costing?.target_margin_percentage).toBeNull()
        expect(costing?.suggested_price).toBeNull()
    })
})

describe("buildProductCostings", () => {
    const products: CostableProduct[] = [
        { product_id: 1, name: "Hamburguesa", price: 5000, target_margin_percentage: 65, lines: hamburguesa },
        { product_id: 2, name: "Pizza", price: 700, target_margin_percentage: null, lines: [] },
    ]

    const defaultParams = {
        wastePercentages: onlyFoodWaste,
    }

    it("costea cada producto con su propio precio y deja sin costear al que no tiene composición", () => {
        const [hamburguesaRow, pizzaRow] = buildProductCostings(products, defaultParams)

        expect(hamburguesaRow.costing?.variable_cost).toBe(2270)
        expect(hamburguesaRow.costing?.contribution_margin).toBe(2730)
        expect(pizzaRow.costing).toBeNull()
    })

    it("sugiere el precio con el margen objetivo de cada producto", () => {
        const [hamburguesaRow, gaseosaRow] = buildProductCostings(
            [
                products[0],
                { ...products[0], product_id: 3, name: "Gaseosa", target_margin_percentage: 80 },
            ],
            defaultParams,
        )

        expect(hamburguesaRow.costing?.target_margin_percentage).toBe(65)
        expect(hamburguesaRow.costing?.suggested_price).toBeCloseTo(2270 / 0.35, 6)
        expect(gaseosaRow.costing?.target_margin_percentage).toBe(80)
        expect(gaseosaRow.costing?.suggested_price).toBeCloseTo(2270 / 0.2, 6)
    })

    it("deja sin precio sugerido al producto que no tiene margen objetivo cargado", () => {
        const [row] = buildProductCostings(
            [{ ...products[0], target_margin_percentage: null }],
            defaultParams,
        )

        expect(row.costing?.variable_cost).toBe(2270)
        expect(row.costing?.target_margin_percentage).toBeNull()
        expect(row.costing?.suggested_price).toBeNull()
    })
})
