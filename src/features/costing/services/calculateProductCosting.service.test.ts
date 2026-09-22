import { describe, expect, it } from "vitest"
import { resolveComponentCost } from "@/features/production/services/calculateProductionCost.service"
import { buildTaxContext } from "@/features/taxes/services/buildTaxContext.service"
import { NO_TAXES, type TaxContext } from "@/features/taxes/types/tax.type"
import { type CostableProduct, type CostingSupplyLine } from "../types/costing.type"
import {
    buildProductCostings,
    calculateProductCosting,
    type CostingParams,
    type WastePercentages,
} from "./calculateProductCosting.service"
import { resolveSupplyUnitCost } from "./resolveSupplyUnitCost.service"

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
    fixedCostPerUnit: 227,
    targetMarginPercentage: 65,
    tax: NO_TAXES,
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

    it("suma el costo fijo por unidad al costo variable", () => {
        const costing = calculateProductCosting(hamburguesa, params)

        expect(costing?.variable_cost).toBe(2270)
        expect(costing?.fixed_cost_amount).toBe(227)
        expect(costing?.total_cost).toBe(2497)
    })

    it("deja el costo total igual al variable cuando todavía no hay fijos que repartir", () => {
        const costing = calculateProductCosting(hamburguesa, { ...params, fixedCostPerUnit: 0 })

        expect(costing?.fixed_cost_amount).toBe(0)
        expect(costing?.total_cost).toBe(costing?.variable_cost)
        expect(costing?.net_margin).toBe(costing?.contribution_margin)
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

    it("devuelve el margen de contribución y el neto en pesos y en porcentaje", () => {
        const costing = calculateProductCosting(hamburguesa, params)

        expect(costing?.contribution_margin).toBe(2730)
        expect(costing?.contribution_margin_percentage).toBeCloseTo(54.6, 10)
        expect(costing?.net_margin).toBe(2503)
        expect(costing?.net_margin_percentage).toBeCloseTo(50.06, 10)
    })

    it("da margen neto negativo cuando el precio no cubre el costo total", () => {
        const costing = calculateProductCosting(hamburguesa, { ...params, price: 2400 })

        expect(costing?.contribution_margin).toBe(130)
        expect(costing?.net_margin).toBe(-97)
        expect(costing?.net_margin_percentage).toBeCloseTo(-4.0417, 4)
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
        expect(() => calculateProductCosting(hamburguesa, { ...params, fixedCostPerUnit: -1 }))
            .toThrowError(/costo fijo por unidad/)
        expect(() => calculateProductCosting(hamburguesa, {
            ...params,
            tax: { ...NO_TAXES, sale_rate: -1 },
        })).toThrowError(/tasas de impuestos/)
    })
})

describe("el precio sugerido", () => {
    it("es el costo total llevado al margen objetivo", () => {
        const costing = calculateProductCosting(hamburguesa, params)

        expect(costing?.suggested_price).toBeCloseTo(2497 / 0.35, 10)
        expect(costing?.suggested_price_difference).toBeCloseTo(2497 / 0.35 - 5000, 10)
    })

    it("sube lo que el precio va a perder en impuestos sobre la venta", () => {
        const costing = calculateProductCosting(hamburguesa, {
            ...params,
            tax: { ...NO_TAXES, sale_rate: 21, payment_rate: 3 },
        })

        expect(costing?.suggested_price).toBeCloseTo((2497 / 0.35) * 1.24, 10)
    })

    it("marca en negativo la diferencia cuando el precio actual ya supera al sugerido", () => {
        const costing = calculateProductCosting(hamburguesa, { ...params, price: 12000 })

        expect(costing!.suggested_price_difference).toBeLessThan(0)
    })

    it("no existe sin margen objetivo: el producto igual se costea", () => {
        const costing = calculateProductCosting(hamburguesa, {
            ...params,
            targetMarginPercentage: null,
        })

        expect(costing?.total_cost).toBe(2497)
        expect(costing?.suggested_price).toBeNull()
        expect(costing?.suggested_price_difference).toBeNull()
    })
})

describe("el motor de impuestos", () => {
    // La cadena completa: precio de compra del insumo → rendimiento → composición
    // → merma → costo fijo → impuestos sobre la venta → ganancia.
    const carne = { origin: "purchased" as const, purchase_price: 12.1, yield_factor: 1, last_production_unit_cost: null }
    const bandeja = { origin: "purchased" as const, purchase_price: 121, yield_factor: 1, last_production_unit_cost: null }

    const buildLines = (tax: TaxContext): CostingSupplyLine[] => [
        {
            supply_id: 1,
            name: "Carne picada",
            type: "food",
            unit: "gr",
            quantity: 100,
            unit_cost: resolveSupplyUnitCost(carne, tax),
        },
        {
            supply_id: 2,
            name: "Bandeja",
            type: "packaging",
            unit: "u",
            quantity: 1,
            unit_cost: resolveSupplyUnitCost(bandeja, tax),
        },
    ]

    const cost = (tax: TaxContext) =>
        calculateProductCosting(buildLines(tax), {
            price: 5000,
            wastePercentages: onlyFoodWaste,
            fixedCostPerUnit: 290.4,
            targetMarginPercentage: 65,
            tax,
        })!

    it("con la tabla de impuestos vacía el precio pagado es el costo y el cobrado es el ingreso", () => {
        const costing = cost(buildTaxContext([]))

        expect(costing.lines[0].unit_cost).toBe(12.1)
        expect(costing.supplies_cost).toBeCloseTo(1331, 10)
        expect(costing.waste_cost).toBeCloseTo(121, 10)
        expect(costing.variable_cost).toBeCloseTo(1452, 10)
        expect(costing.net_price).toBe(5000)
        expect(costing.sale_tax_amount).toBe(0)
        expect(costing.total_cost).toBeCloseTo(1742.4, 10)
        expect(costing.contribution_margin).toBeCloseTo(3548, 10)
        expect(costing.profit_tax_amount).toBe(0)
        expect(costing.net_margin).toBeCloseTo(3257.6, 10)
        expect(costing.net_margin_percentage).toBeCloseTo(65.152, 10)
    })

    it("con IVA compras recuperable e IVA ventas el crédito fiscal no es costo y el IVA no es ingreso", () => {
        const tax = buildTaxContext([
            { type: "purchase", rate: 21, amount: 0, is_recoverable: true, payment_method_id: null, is_active: true },
            { type: "sale", rate: 21, amount: 0, is_recoverable: false, payment_method_id: null, is_active: true },
        ])

        const costing = cost(tax)

        expect(costing.lines[0].unit_cost).toBeCloseTo(10, 10)
        expect(costing.lines[1].unit_cost).toBeCloseTo(100, 10)
        expect(costing.supplies_cost).toBeCloseTo(1100, 10)
        expect(costing.variable_cost).toBeCloseTo(1200, 10)
        expect(costing.net_price).toBeCloseTo(5000 / 1.21, 10)
        expect(costing.total_cost).toBeCloseTo(1490.4, 10)
        expect(costing.contribution_margin).toBeCloseTo(5000 / 1.21 - 1200, 10)
    })

    it("un impuesto de compra que no se recupera queda adentro del costo", () => {
        const noRecoverable = buildTaxContext([
            { type: "purchase", rate: 21, amount: 0, is_recoverable: false, payment_method_id: null, is_active: true },
        ])

        expect(cost(noRecoverable).lines[0].unit_cost).toBe(12.1)
    })

    it("los impuestos sobre la ganancia se aplican después de restar todos los costos", () => {
        const tax = buildTaxContext([
            { type: "profit", rate: 35, amount: 0, is_recoverable: false, payment_method_id: null, is_active: true },
        ])

        const costing = cost(tax)

        expect(costing.gross_profit).toBeCloseTo(3257.6, 10)
        expect(costing.profit_tax_amount).toBeCloseTo(3257.6 * 0.35, 10)
        expect(costing.net_margin).toBeCloseTo(3257.6 * 0.65, 10)
    })

    it("una pérdida no paga impuesto a la ganancia", () => {
        const tax = buildTaxContext([
            { type: "profit", rate: 35, amount: 0, is_recoverable: false, payment_method_id: null, is_active: true },
        ])

        const costing = calculateProductCosting(buildLines(tax), {
            price: 1000,
            wastePercentages: onlyFoodWaste,
            fixedCostPerUnit: 290.4,
            targetMarginPercentage: 65,
            tax,
        })!

        expect(costing.net_margin).toBeLessThan(0)
        expect(costing.profit_tax_amount).toBe(0)
        expect(costing.net_margin).toBe(costing.gross_profit)
    })

    it("la comisión del medio de pago se descuenta del precio junto con el impuesto a la venta", () => {
        const tax = buildTaxContext(
            [{ type: "payment", rate: 6, amount: 0, is_recoverable: false, payment_method_id: 2, is_active: true }],
            [
                { payment_method_id: 1, amount: 5000 },
                { payment_method_id: 2, amount: 5000 },
            ],
        )

        const costing = cost(tax)

        expect(tax.payment_rate).toBeCloseTo(3, 10)
        expect(costing.net_price).toBeCloseTo(5000 / 1.03, 10)
        expect(costing.sale_tax_amount).toBeCloseTo(5000 - 5000 / 1.03, 10)
    })
})

describe("buildProductCostings", () => {
    const products: CostableProduct[] = [
        { product_id: 1, name: "Hamburguesa", price: 5000, target_margin_percentage: 65, lines: hamburguesa },
        { product_id: 2, name: "Pizza", price: 700, target_margin_percentage: null, lines: [] },
    ]

    const defaultParams = {
        wastePercentages: onlyFoodWaste,
        fixedCostPerUnit: 227,
        tax: NO_TAXES,
    }

    it("costea cada producto con su propio precio y deja sin costear al que no tiene composición", () => {
        const [hamburguesaRow, pizzaRow] = buildProductCostings(products, defaultParams)

        expect(hamburguesaRow.costing?.total_cost).toBe(2497)
        expect(hamburguesaRow.costing?.net_margin).toBe(2503)
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
        expect(hamburguesaRow.costing?.suggested_price).toBeCloseTo(2497 / 0.35, 6)
        expect(gaseosaRow.costing?.target_margin_percentage).toBe(80)
        expect(gaseosaRow.costing?.suggested_price).toBeCloseTo(2497 / 0.2, 6)
    })

    it("deja sin precio sugerido al producto que no tiene margen objetivo cargado", () => {
        const [row] = buildProductCostings(
            [{ ...products[0], target_margin_percentage: null }],
            defaultParams,
        )

        expect(row.costing?.total_cost).toBe(2497)
        expect(row.costing?.target_margin_percentage).toBeNull()
        expect(row.costing?.suggested_price).toBeNull()
        expect(row.costing?.suggested_price_difference).toBeNull()
    })
})
