import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createAuthenticatedClient, type ApiClient } from "./support/api-client"
import {
    closeCashSession,
    createOrder,
    findPaymentMethod,
    findProduct,
    listOrders,
    startFreshCashSession,
} from "./support/pos"

const PRODUCT = "Coca-Cola lata"

describe("Pago dividido", () => {
    let client: ApiClient
    let cashSessionId: number

    beforeAll(async () => {
        client = await createAuthenticatedClient()
        cashSessionId = (await startFreshCashSession(client, 0)).id
    })

    afterAll(async () => {
        await closeCashSession(client, cashSessionId, 0)
    })

    it("aplica el ajuste solo a la parte cobrada con el método que lo tiene", async () => {
        const product = await findProduct(client, PRODUCT)
        const cash = await findPaymentMethod(client, "Efectivo")
        const credit = await findPaymentMethod(client, "Crédito")

        const subTotal = product.price * 2
        const half = subTotal / 2
        const cashAdjustment = half * (cash.tax / 100)
        const creditAdjustment = half * (credit.tax / 100)

        const order = await createOrder(client, [{ product_id: product.id, quantity: 2 }], "paid", [
            { payment_method_id: cash.id, amount: half },
            { payment_method_id: credit.id, amount: half },
        ])

        const cashPayment = order.payments.find((payment) => payment.payment_method_id === cash.id)
        const creditPayment = order.payments.find((payment) => payment.payment_method_id === credit.id)

        expect(cash.tax).toBeLessThan(0)
        expect(cashPayment?.surcharge_amount).toBeCloseTo(cashAdjustment, 2)
        expect(creditPayment?.surcharge_amount).toBeCloseTo(creditAdjustment, 2)
        expect(order.sub_total).toBe(subTotal)
        expect(order.tax).toBeCloseTo(cashAdjustment + creditAdjustment, 2)
        expect(order.total).toBeCloseTo(subTotal + cashAdjustment + creditAdjustment, 2)
        expect(order.total).toBeLessThan(order.sub_total)
    })

    it("cobra menos que el subtotal cuando toda la venta va en efectivo", async () => {
        const product = await findProduct(client, PRODUCT)
        const cash = await findPaymentMethod(client, "Efectivo")

        const subTotal = product.price * 3
        const discount = subTotal * (cash.tax / 100)

        const order = await createOrder(client, [{ product_id: product.id, quantity: 3 }], "paid", [
            { payment_method_id: cash.id, amount: subTotal },
        ])

        expect(order.sub_total).toBe(subTotal)
        expect(order.tax).toBeCloseTo(discount, 2)
        expect(order.total).toBeCloseTo(subTotal + discount, 2)
        expect(order.total).toBeLessThan(subTotal)
        expect(order.payments[0].surcharge_amount).toBeCloseTo(discount, 2)
    })

    it("suma los ajustes de cada parte cuando una descuenta y la otra recarga", async () => {
        const product = await findProduct(client, PRODUCT)
        const cash = await findPaymentMethod(client, "Efectivo")
        const installments = await findPaymentMethod(client, "Crédito 3 cuotas")

        const subTotal = product.price * 4
        const half = subTotal / 2
        const adjustment = half * (cash.tax / 100) + half * (installments.tax / 100)

        const order = await createOrder(client, [{ product_id: product.id, quantity: 4 }], "paid", [
            { payment_method_id: cash.id, amount: half },
            { payment_method_id: installments.id, amount: half },
        ])

        expect(cash.tax).toBeLessThan(0)
        expect(installments.tax).toBeGreaterThan(0)
        expect(order.tax).toBeCloseTo(adjustment, 2)
        expect(order.total).toBeCloseTo(subTotal + adjustment, 2)
        expect(order.payments).toHaveLength(2)
    })

    it("rechaza el cobro cuando los pagos no cubren el total", async () => {
        const product = await findProduct(client, PRODUCT)
        const cash = await findPaymentMethod(client, "Efectivo")
        const credit = await findPaymentMethod(client, "Crédito")
        const ordersBefore = (await listOrders(client)).length

        const response = await client.send<{ error: string }>("POST", "/api/orders", {
            items: [{ product_id: product.id, quantity: 2 }],
            status: "paid",
            payments: [
                { payment_method_id: cash.id, amount: product.price * 0.5 },
                { payment_method_id: credit.id, amount: product.price * 0.5 },
            ],
        })

        expect(response.status).toBe(400)
        expect(response.body.error).toMatch(/no cubren el total/i)
        expect((await listOrders(client)).length).toBe(ordersBefore)
    })

    it("rechaza el cobro cuando los pagos se pasan del total", async () => {
        const product = await findProduct(client, PRODUCT)
        const cash = await findPaymentMethod(client, "Efectivo")
        const ordersBefore = (await listOrders(client)).length

        const response = await client.send<{ error: string }>("POST", "/api/orders", {
            items: [{ product_id: product.id, quantity: 1 }],
            status: "paid",
            payments: [{ payment_method_id: cash.id, amount: product.price + 100 }],
        })

        expect(response.status).toBe(400)
        expect(response.body.error).toMatch(/superan el total/i)
        expect((await listOrders(client)).length).toBe(ordersBefore)
    })
})
