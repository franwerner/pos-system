import { describe, expect, it } from "vitest"
import { normalizeTaxInput } from "./normalizeTaxInput.service"
import { type TaxInput } from "../types/tax.type"

const input: TaxInput = {
    name: "  IVA compras  ",
    type: "purchase",
    rate: 21,
    amount: 32000,
    is_recoverable: true,
    payment_method_id: 3,
    is_active: true,
}

describe("normalizeTaxInput", () => {
    it("un impuesto de compra conserva su tasa y su recuperabilidad, y suelta el resto", () => {
        expect(normalizeTaxInput(input)).toEqual({
            name: "IVA compras",
            type: "purchase",
            rate: 21,
            amount: 0,
            is_recoverable: true,
            payment_method_id: null,
            is_active: true,
        })
    })

    it("un monto fijo mensual se queda con el monto y pierde la tasa", () => {
        const monthly = normalizeTaxInput({ ...input, type: "monthly_fixed" })

        expect(monthly.rate).toBe(0)
        expect(monthly.amount).toBe(32000)
        expect(monthly.is_recoverable).toBe(false)
    })

    it("un impuesto por medio de pago conserva el medio de pago", () => {
        const payment = normalizeTaxInput({ ...input, type: "payment" })

        expect(payment.payment_method_id).toBe(3)
        expect(payment.amount).toBe(0)
        expect(payment.is_recoverable).toBe(false)
    })

    it("un impuesto sobre la venta o la ganancia se queda solo con la tasa", () => {
        expect(normalizeTaxInput({ ...input, type: "sale" })).toMatchObject({
            rate: 21,
            amount: 0,
            is_recoverable: false,
            payment_method_id: null,
        })
    })
})
