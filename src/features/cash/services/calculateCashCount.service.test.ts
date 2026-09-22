import { describe, expect, it } from "vitest"
import { calculateCashCount } from "./calculateCashCount.service"

const paymentMethods = [
    { id: 1, name: "Efectivo" },
    { id: 2, name: "Débito" },
    { id: 3, name: "Crédito" },
]

const baseInput = {
    openingAmount: 10000,
    movements: [],
    paymentMethods,
    cashPaymentMethodIds: [1],
}

describe("calculateCashCount", () => {
    it("una caja sin ventas espera el monto inicial", () => {
        const count = calculateCashCount({ ...baseInput, sales: [] })

        expect(count.salesTotal).toBe(0)
        expect(count.expectedAmount).toBe(10000)
        expect(count.totalsByPaymentMethod).toEqual([])
    })

    it("suma las ventas en efectivo al monto inicial", () => {
        const count = calculateCashCount({
            ...baseInput,
            sales: [
                { payment_method_id: 1, total: 2700 },
                { payment_method_id: 1, total: 1320.5 },
                { payment_method_id: 1, total: 37500 },
            ],
        })

        expect(count.cashSalesTotal).toBe(41520.5)
        expect(count.expectedAmount).toBe(51520.5)
    })

    it("una venta en efectivo con descuento entra por lo que se cobró de verdad", () => {
        const count = calculateCashCount({
            ...baseInput,
            sales: [{ payment_method_id: 1, total: 9000 }],
            countedAmount: 19000,
        })

        expect(count.cashSalesTotal).toBe(9000)
        expect(count.expectedAmount).toBe(19000)
        expect(count.difference).toBe(0)
    })

    it("el arqueo cierra con descuentos y recargos mezclados en la misma caja", () => {
        const count = calculateCashCount({
            ...baseInput,
            sales: [
                { payment_method_id: 1, total: 4500 },
                { payment_method_id: 1, total: 900 },
                { payment_method_id: 3, total: 2360 },
            ],
            countedAmount: 15400,
        })

        expect(count.cashSalesTotal).toBe(5400)
        expect(count.otherSalesTotal).toBe(2360)
        expect(count.expectedAmount).toBe(15400)
        expect(count.difference).toBe(0)
    })

    it("las ventas con tarjeta no suman al esperado en caja", () => {
        const count = calculateCashCount({
            ...baseInput,
            sales: [
                { payment_method_id: 1, total: 5000 },
                { payment_method_id: 2, total: 8000 },
                { payment_method_id: 3, total: 12000 },
            ],
        })

        expect(count.cashSalesTotal).toBe(5000)
        expect(count.otherSalesTotal).toBe(20000)
        expect(count.salesTotal).toBe(25000)
        expect(count.expectedAmount).toBe(15000)
    })

    it("desglosa las ventas por método de pago", () => {
        const count = calculateCashCount({
            ...baseInput,
            sales: [
                { payment_method_id: 3, total: 1000 },
                { payment_method_id: 1, total: 2000 },
                { payment_method_id: 3, total: 500 },
            ],
        })

        expect(count.totalsByPaymentMethod).toEqual([
            { payment_method_id: 1, name: "Efectivo", total: 2000, is_cash: true },
            { payment_method_id: 3, name: "Crédito", total: 1500, is_cash: false },
        ])
    })

    it("nombra los métodos de pago que ya no están en la lista", () => {
        const count = calculateCashCount({
            ...baseInput,
            sales: [{ payment_method_id: 9, total: 400 }],
        })

        expect(count.totalsByPaymentMethod[0].name).toBe("Método #9")
    })

    it("una diferencia positiva es plata que sobra", () => {
        const count = calculateCashCount({
            ...baseInput,
            sales: [{ payment_method_id: 1, total: 5000 }],
            countedAmount: 15500,
        })

        expect(count.expectedAmount).toBe(15000)
        expect(count.difference).toBe(500)
    })

    it("una diferencia negativa es plata que falta", () => {
        const count = calculateCashCount({
            ...baseInput,
            sales: [{ payment_method_id: 1, total: 5000 }],
            countedAmount: 14200,
        })

        expect(count.difference).toBe(-800)
    })

    it("el arqueo cierra en cero cuando el contado es el esperado", () => {
        const count = calculateCashCount({
            ...baseInput,
            sales: [
                { payment_method_id: 1, total: 5000 },
                { payment_method_id: 2, total: 9000 },
            ],
            countedAmount: 15000,
        })

        expect(count.difference).toBe(0)
    })

    it("sin monto contado no hay diferencia", () => {
        const count = calculateCashCount({ ...baseInput, sales: [] })

        expect(count.countedAmount).toBeNull()
        expect(count.difference).toBeNull()
    })

    it("no arrastra el error del punto flotante", () => {
        const count = calculateCashCount({
            openingAmount: 0,
            movements: [],
            paymentMethods,
            cashPaymentMethodIds: [1],
            sales: [
                { payment_method_id: 1, total: 0.1 },
                { payment_method_id: 1, total: 0.2 },
            ],
            countedAmount: 0.3,
        })

        expect(count.expectedAmount).toBe(0.3)
        expect(count.difference).toBe(0)
    })


    it("los ingresos suman al esperado en caja", () => {
        const count = calculateCashCount({
            ...baseInput,
            sales: [{ payment_method_id: 1, total: 5000 }],
            movements: [
                { type: "deposit", amount: 1500 },
                { type: "deposit", amount: 500.5 },
            ],
        })

        expect(count.depositsTotal).toBe(2000.5)
        expect(count.withdrawalsTotal).toBe(0)
        expect(count.expectedAmount).toBe(17000.5)
    })

    it("los egresos restan del esperado en caja", () => {
        const count = calculateCashCount({
            ...baseInput,
            sales: [{ payment_method_id: 1, total: 5000 }],
            movements: [
                { type: "withdrawal", amount: 3000 },
                { type: "withdrawal", amount: 250.25 },
            ],
        })

        expect(count.depositsTotal).toBe(0)
        expect(count.withdrawalsTotal).toBe(3250.25)
        expect(count.expectedAmount).toBe(11749.75)
    })

    it("con ingresos y egresos el esperado sale de la suma con signo", () => {
        const count = calculateCashCount({
            ...baseInput,
            sales: [
                { payment_method_id: 1, total: 5000 },
                { payment_method_id: 2, total: 9000 },
            ],
            movements: [
                { type: "deposit", amount: 2000 },
                { type: "withdrawal", amount: 800 },
                { type: "deposit", amount: 300 },
            ],
            countedAmount: 16500,
        })

        expect(count.depositsTotal).toBe(2300)
        expect(count.withdrawalsTotal).toBe(800)
        expect(count.expectedAmount).toBe(16500)
        expect(count.difference).toBe(0)
    })

    it("un egreso mayor al efectivo disponible deja el esperado por debajo del inicial", () => {
        const count = calculateCashCount({
            ...baseInput,
            sales: [{ payment_method_id: 1, total: 2000 }],
            movements: [{ type: "withdrawal", amount: 9000 }],
            countedAmount: 3000,
        })

        expect(count.expectedAmount).toBe(3000)
        expect(count.expectedAmount).toBeLessThan(count.openingAmount)
        expect(count.difference).toBe(0)
    })

    it("un egreso mayor al esperado deja el esperado en negativo sin romper el arqueo", () => {
        const count = calculateCashCount({
            ...baseInput,
            sales: [],
            movements: [{ type: "withdrawal", amount: 12000 }],
            countedAmount: 0,
        })

        expect(count.expectedAmount).toBe(-2000)
        expect(count.difference).toBe(2000)
    })

    it("rechaza movimientos con monto menor o igual a 0", () => {
        expect(() => calculateCashCount({
            ...baseInput,
            sales: [],
            movements: [{ type: "deposit", amount: 0 }],
        })).toThrowError(/monto del movimiento/)
    })

    it("rechaza montos iniciales negativos", () => {
        expect(() => calculateCashCount({ ...baseInput, openingAmount: -1, sales: [] }))
            .toThrowError(/monto inicial/)
    })

    it("rechaza montos contados negativos", () => {
        expect(() => calculateCashCount({ ...baseInput, sales: [], countedAmount: -1 }))
            .toThrowError(/monto contado/)
    })
})
