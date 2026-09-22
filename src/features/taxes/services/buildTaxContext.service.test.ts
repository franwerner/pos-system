import { describe, expect, it } from "vitest"
import { NO_TAXES } from "../types/tax.type"
import { buildTaxContext, type TaxSource } from "./buildTaxContext.service"

const tax = (overrides: Partial<TaxSource> & Pick<TaxSource, "type">): TaxSource => ({
    rate: 0,
    amount: 0,
    is_recoverable: false,
    payment_method_id: null,
    is_active: true,
    ...overrides,
})

describe("buildTaxContext", () => {
    it("con la tabla vacía no descuenta nada en ningún paso", () => {
        expect(buildTaxContext([])).toEqual(NO_TAXES)
    })

    it("solo descuenta del precio de compra el impuesto que se recupera", () => {
        const context = buildTaxContext([
            tax({ type: "purchase", rate: 21, is_recoverable: true }),
            tax({ type: "purchase", rate: 5, is_recoverable: false }),
        ])

        expect(context.purchase_rate).toBe(21)
    })

    it("suma las tasas de venta y las de ganancia por separado", () => {
        const context = buildTaxContext([
            tax({ type: "sale", rate: 21 }),
            tax({ type: "sale", rate: 3 }),
            tax({ type: "profit", rate: 35 }),
        ])

        expect(context.sale_rate).toBe(24)
        expect(context.profit_rate).toBe(35)
    })

    it("acumula los montos fijos mensuales", () => {
        expect(buildTaxContext([
            tax({ type: "monthly_fixed", amount: 32000 }),
            tax({ type: "monthly_fixed", amount: 8000 }),
        ]).monthly_fixed_amount).toBe(40000)
    })

    it("pondera los impuestos por medio de pago con lo cobrado en el período", () => {
        const context = buildTaxContext(
            [tax({ type: "payment", rate: 4, payment_method_id: 2 })],
            [
                { payment_method_id: 1, amount: 7500 },
                { payment_method_id: 2, amount: 2500 },
            ],
        )

        expect(context.payment_rate).toBeCloseTo(1, 10)
    })

    it("ignora los impuestos desactivados", () => {
        expect(buildTaxContext([
            tax({ type: "sale", rate: 21, is_active: false }),
            tax({ type: "monthly_fixed", amount: 32000, is_active: false }),
        ])).toEqual(NO_TAXES)
    })

    it("rechaza tasas y montos inválidos", () => {
        expect(() => buildTaxContext([tax({ type: "sale", rate: -1 })])).toThrowError(/tasa/)
        expect(() => buildTaxContext([tax({ type: "monthly_fixed", amount: Number.NaN })]))
            .toThrowError(/monto/)
    })
})
