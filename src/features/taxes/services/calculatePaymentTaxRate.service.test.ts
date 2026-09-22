import { describe, expect, it } from "vitest"
import { calculatePaymentTaxRate } from "./calculatePaymentTaxRate.service"

const creditCommission = [{ payment_method_id: 2, rate: 3 }]

describe("calculatePaymentTaxRate", () => {
    it("sin impuestos por medio de pago no descuenta nada", () => {
        expect(calculatePaymentTaxRate([], [{ payment_method_id: 1, amount: 1000 }])).toBe(0)
    })

    it("pondera cada impuesto por lo que se cobró con su medio de pago", () => {
        const rate = calculatePaymentTaxRate(creditCommission, [
            { payment_method_id: 1, amount: 5000 },
            { payment_method_id: 2, amount: 5000 },
        ])

        expect(rate).toBeCloseTo(1.5, 10)
    })

    it("aplica la tasa entera cuando todo se cobra con ese medio de pago", () => {
        expect(calculatePaymentTaxRate(creditCommission, [
            { payment_method_id: 2, amount: 8000 },
        ])).toBe(3)
    })

    it("no descuenta nada si nunca se cobró con el medio que tiene el impuesto", () => {
        expect(calculatePaymentTaxRate(creditCommission, [
            { payment_method_id: 1, amount: 8000 },
        ])).toBe(0)
    })

    it("sin ventas con qué ponderar usa el promedio simple de los activos", () => {
        expect(calculatePaymentTaxRate([
            { payment_method_id: 2, rate: 3 },
            { payment_method_id: 3, rate: 7 },
        ], [])).toBe(5)
    })

    it("junta varios cobros del mismo medio de pago", () => {
        expect(calculatePaymentTaxRate(creditCommission, [
            { payment_method_id: 2, amount: 3000 },
            { payment_method_id: 2, amount: 1000 },
            { payment_method_id: 1, amount: 4000 },
        ])).toBeCloseTo(1.5, 10)
    })

    it("rechaza tasas y montos inválidos", () => {
        expect(() => calculatePaymentTaxRate([{ payment_method_id: 2, rate: -1 }], []))
            .toThrowError(/tasa/)
        expect(() => calculatePaymentTaxRate(creditCommission, [
            { payment_method_id: 2, amount: -5 },
        ])).toThrowError(/medio de pago/)
    })
})
