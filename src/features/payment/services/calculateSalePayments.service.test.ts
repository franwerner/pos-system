import { describe, expect, it } from "vitest"
import {
    calculateSalePayments,
    findPaymentsCoverageError,
} from "./calculateSalePayments.service"

const paymentMethods = [
    { id: 1, tax: 0 },
    { id: 2, tax: 10 },
    { id: 3, tax: 21.5 },
    { id: 4, tax: -10 },
]

describe("calculateSalePayments", () => {
    it("un pago sin ajuste da el total tal cual", () => {
        const breakdown = calculateSalePayments([{ payment_method_id: 1, amount: 10000 }], paymentMethods, 10000)

        expect(breakdown.lines).toEqual([
            { payment_method_id: 1, amount: 10000, surcharge_amount: 0 },
        ])
        expect(breakdown.total).toBe(10000)
        expect(breakdown.remaining).toBe(0)
    })

    it("aplica el recargo del método sobre el monto de su propio pago", () => {
        const breakdown = calculateSalePayments([{ payment_method_id: 2, amount: 5000 }], paymentMethods, 5000)

        expect(breakdown.surchargeTotal).toBe(500)
        expect(breakdown.total).toBe(5500)
    })

    it("en un pago dividido el recargo solo toca la parte con recargo", () => {
        const breakdown = calculateSalePayments([
            { payment_method_id: 1, amount: 6000 },
            { payment_method_id: 2, amount: 4000 },
        ], paymentMethods, 10000)

        expect(breakdown.lines).toEqual([
            { payment_method_id: 1, amount: 6000, surcharge_amount: 0 },
            { payment_method_id: 2, amount: 4000, surcharge_amount: 400 },
        ])
        expect(breakdown.paymentsTotal).toBe(10000)
        expect(breakdown.surchargeTotal).toBe(400)
        expect(breakdown.total).toBe(10400)
    })

    it("un pago con porcentaje negativo descuenta y deja el total bajo el subtotal", () => {
        const breakdown = calculateSalePayments([{ payment_method_id: 4, amount: 10000 }], paymentMethods, 10000)

        expect(breakdown.lines).toEqual([
            { payment_method_id: 4, amount: 10000, surcharge_amount: -1000 },
        ])
        expect(breakdown.surchargeTotal).toBe(-1000)
        expect(breakdown.total).toBe(9000)
        expect(breakdown.total).toBeLessThan(10000)
        expect(breakdown.remaining).toBe(0)
    })

    it("en un pago dividido el descuento solo toca la parte que lo tiene", () => {
        const breakdown = calculateSalePayments([
            { payment_method_id: 4, amount: 5000 },
            { payment_method_id: 1, amount: 5000 },
        ], paymentMethods, 10000)

        expect(breakdown.lines).toEqual([
            { payment_method_id: 4, amount: 5000, surcharge_amount: -500 },
            { payment_method_id: 1, amount: 5000, surcharge_amount: 0 },
        ])
        expect(breakdown.paymentsTotal).toBe(10000)
        expect(breakdown.surchargeTotal).toBe(-500)
        expect(breakdown.total).toBe(9500)
        expect(breakdown.remaining).toBe(0)
    })

    it("un descuento y un recargo en la misma venta se compensan", () => {
        const breakdown = calculateSalePayments([
            { payment_method_id: 4, amount: 5000 },
            { payment_method_id: 2, amount: 5000 },
        ], paymentMethods, 10000)

        expect(breakdown.surchargeTotal).toBe(0)
        expect(breakdown.total).toBe(10000)
    })

    it("cada pago usa el porcentaje de su propio método", () => {
        const breakdown = calculateSalePayments([
            { payment_method_id: 2, amount: 1000 },
            { payment_method_id: 3, amount: 1000 },
        ], paymentMethods, 2000)

        expect(breakdown.lines[0].surcharge_amount).toBe(100)
        expect(breakdown.lines[1].surcharge_amount).toBe(215)
        expect(breakdown.total).toBe(2315)
    })

    it("redondea el recargo a dos decimales", () => {
        const breakdown = calculateSalePayments([{ payment_method_id: 3, amount: 333.33 }], paymentMethods, 333.33)

        expect(breakdown.lines[0].surcharge_amount).toBe(71.67)
        expect(breakdown.total).toBe(405)
    })

    it("no arrastra el error del punto flotante al repartir", () => {
        const breakdown = calculateSalePayments([
            { payment_method_id: 1, amount: 0.1 },
            { payment_method_id: 1, amount: 0.2 },
        ], paymentMethods, 0.3)

        expect(breakdown.paymentsTotal).toBe(0.3)
        expect(breakdown.remaining).toBe(0)
    })

    it("rechaza un método de pago que no existe", () => {
        expect(() => calculateSalePayments([{ payment_method_id: 99, amount: 100 }], paymentMethods, 100))
            .toThrowError(/no existe/)
    })

    it("rechaza un monto que no es mayor a 0", () => {
        expect(() => calculateSalePayments([{ payment_method_id: 1, amount: 0 }], paymentMethods, 100))
            .toThrowError(/mayor a 0/)
    })

    it("rechaza un total de venta que no es mayor a 0", () => {
        expect(() => calculateSalePayments([{ payment_method_id: 1, amount: 100 }], paymentMethods, 0))
            .toThrowError(/total de la venta/)
    })
})

describe("findPaymentsCoverageError", () => {
    it("acepta los pagos que cubren exactamente el total", () => {
        const breakdown = calculateSalePayments([
            { payment_method_id: 1, amount: 2500 },
            { payment_method_id: 2, amount: 2500 },
        ], paymentMethods, 5000)

        expect(findPaymentsCoverageError(breakdown)).toBeNull()
    })

    it("avisa cuánto falta cuando los pagos no llegan al total", () => {
        const breakdown = calculateSalePayments([{ payment_method_id: 1, amount: 3000 }], paymentMethods, 5000)

        expect(breakdown.remaining).toBe(2000)
        expect(findPaymentsCoverageError(breakdown)).toMatch(/no cubren/)
    })

    it("avisa cuánto sobra cuando los pagos pasan el total", () => {
        const breakdown = calculateSalePayments([{ payment_method_id: 1, amount: 6000 }], paymentMethods, 5000)

        expect(breakdown.remaining).toBe(-1000)
        expect(findPaymentsCoverageError(breakdown)).toMatch(/superan/)
    })

    it("el ajuste no cuenta como parte cubierta del total", () => {
        const breakdown = calculateSalePayments([{ payment_method_id: 2, amount: 4545.45 }], paymentMethods, 5000)

        expect(breakdown.total).toBe(5000)
        expect(findPaymentsCoverageError(breakdown)).toMatch(/no cubren/)
    })

    it("el descuento tampoco mueve lo que falta cubrir del total", () => {
        const breakdown = calculateSalePayments([{ payment_method_id: 4, amount: 4000 }], paymentMethods, 5000)

        expect(breakdown.total).toBe(3600)
        expect(breakdown.remaining).toBe(1000)
        expect(findPaymentsCoverageError(breakdown)).toMatch(/no cubren/)
    })

    it("pide al menos un pago cuando no se registró ninguno", () => {
        const breakdown = calculateSalePayments([], paymentMethods, 5000)

        expect(findPaymentsCoverageError(breakdown)).toMatch(/al menos un pago/)
    })
})
