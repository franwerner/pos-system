import { beforeAll, describe, expect, it } from "vitest"
import { calculateCashCount } from "@/features/cash/services/calculateCashCount.service"
import { resolveCashPaymentMethodIds } from "@/features/cash/services/resolveCashPaymentMethods.service"
import { createAuthenticatedClient, type ApiClient } from "./support/api-client"
import {
    closeCashSession,
    createOrder,
    findOpenCashSession,
    findPaymentMethod,
    findProduct,
    listCashSessions,
    listPaymentMethods,
    readConfig,
    startFreshCashSession,
} from "./support/pos"

// El café no tiene composición: las ventas del arqueo no dependen de stock.
const PRODUCT = "Café"

const OPENING_AMOUNT = 5000
const CASH_SHORTAGE = 200

describe("Caja", () => {
    let client: ApiClient

    beforeAll(async () => {
        client = await createAuthenticatedClient()
    })

    it("espera en el cajón solo lo cobrado en efectivo e informa los otros métodos aparte", async () => {
        const product = await findProduct(client, PRODUCT)
        const cash = await findPaymentMethod(client, "Efectivo")
        const installments = await findPaymentMethod(client, "Crédito 3 cuotas")

        const session = await startFreshCashSession(client, OPENING_AMOUNT)

        const cashSale = await createOrder(client, [{ product_id: product.id, quantity: 1 }], "paid", [
            { payment_method_id: cash.id, amount: product.price },
        ])

        const cardSale = await createOrder(client, [{ product_id: product.id, quantity: 2 }], "paid", [
            { payment_method_id: installments.id, amount: product.price * 2 },
        ])

        // Un pendiente todavía no entró plata: no puede pesar en el arqueo.
        await createOrder(client, [{ product_id: product.id, quantity: 5 }], "pending")

        const countedAmount = OPENING_AMOUNT + cashSale.total - CASH_SHORTAGE

        await closeCashSession(client, session.id, countedAmount)

        const closed = (await listCashSessions(client)).find((item) => item.id === session.id)

        expect(closed).toBeDefined()
        expect(closed?.closed_at).not.toBeNull()

        const paymentMethods = await listPaymentMethods(client)
        const config = await readConfig(client)

        const count = calculateCashCount({
            openingAmount: closed!.opening_amount,
            sales: closed!.payments,
            movements: closed!.movements,
            paymentMethods,
            cashPaymentMethodIds: resolveCashPaymentMethodIds(paymentMethods, config.default_payment.id),
            countedAmount: closed!.counted_amount,
        })

        // Lo que entra al cajón es lo cobrado de verdad: con descuento por efectivo,
        // menos que el subtotal de la venta.
        expect(cashSale.total).toBeLessThan(cashSale.sub_total)
        expect(count.cashSalesTotal).toBeCloseTo(cashSale.total, 2)
        expect(count.otherSalesTotal).toBeCloseTo(cardSale.total, 2)
        expect(count.expectedAmount).toBeCloseTo(OPENING_AMOUNT + cashSale.total, 2)
        expect(count.difference).toBeCloseTo(-CASH_SHORTAGE, 2)

        const cashTotal = count.totalsByPaymentMethod.find((item) => item.payment_method_id === cash.id)
        const cardTotal = count.totalsByPaymentMethod.find((item) => item.payment_method_id === installments.id)

        expect(cashTotal?.is_cash).toBe(true)
        expect(cardTotal?.is_cash).toBe(false)
        expect(cardTotal?.total).toBeCloseTo(cardSale.total, 2)
    })

    it("no deja abrir una caja mientras hay otra abierta", async () => {
        await startFreshCashSession(client, 0)

        const response = await client.send("POST", "/api/cash-sessions", { opening_amount: 0, note: null })

        expect(response.status).toBe(409)

        const open = await findOpenCashSession(client)

        expect(open).not.toBeNull()

        await closeCashSession(client, open!.id, 0)
    })

    it("no deja cerrar dos veces la misma caja", async () => {
        const session = await startFreshCashSession(client, 0)

        await closeCashSession(client, session.id, 0)

        const response = await client.send("PATCH", `/api/cash-sessions/${session.id}`, {
            counted_amount: 0,
            note: null,
        })

        expect(response.status).toBe(409)
    })
})
