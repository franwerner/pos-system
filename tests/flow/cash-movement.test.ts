import { beforeAll, describe, expect, it } from "vitest"
import { calculateCashCount } from "@/features/cash/services/calculateCashCount.service"
import { resolveCashPaymentMethodIds } from "@/features/cash/services/resolveCashPaymentMethods.service"
import { createAuthenticatedClient, type ApiClient } from "./support/api-client"
import {
    closeCashSession,
    createCashMovement,
    createOrder,
    findPaymentMethod,
    findProduct,
    listCashMovements,
    listCashSessions,
    listPaymentMethods,
    readConfig,
    startFreshCashSession,
} from "./support/pos"

// El café no tiene composición: las ventas del arqueo no dependen de stock.
const PRODUCT = "Café"

const OPENING_AMOUNT = 8000
const DEPOSIT_AMOUNT = 2500
const WITHDRAWAL_AMOUNT = 1800

describe("Ingresos y egresos de caja", () => {
    let client: ApiClient

    beforeAll(async () => {
        client = await createAuthenticatedClient()
    })

    it("el esperado suma los ingresos y resta los egresos sobre las ventas en efectivo", async () => {
        const product = await findProduct(client, PRODUCT)
        const cash = await findPaymentMethod(client, "Efectivo")

        const session = await startFreshCashSession(client, OPENING_AMOUNT)

        const cashSale = await createOrder(client, [{ product_id: product.id, quantity: 2 }], "paid", [
            { payment_method_id: cash.id, amount: product.price * 2 },
        ])

        await createCashMovement(client, session.id, "deposit", DEPOSIT_AMOUNT, "Aporte de cambio")
        await createCashMovement(client, session.id, "withdrawal", WITHDRAWAL_AMOUNT, "Pago del flete")

        const movements = await listCashMovements(client, session.id)

        expect(movements).toHaveLength(2)
        expect(movements.map((movement) => movement.type)).toEqual(["deposit", "withdrawal"])
        expect(movements.map((movement) => movement.concept))
            .toEqual(["Aporte de cambio", "Pago del flete"])

        const expectedAmount = OPENING_AMOUNT + cashSale.total + DEPOSIT_AMOUNT - WITHDRAWAL_AMOUNT

        await closeCashSession(client, session.id, expectedAmount)

        const closed = (await listCashSessions(client)).find((item) => item.id === session.id)

        expect(closed).toBeDefined()
        expect(closed?.movements).toHaveLength(2)

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

        expect(count.cashSalesTotal).toBeCloseTo(cashSale.total, 2)
        expect(count.depositsTotal).toBeCloseTo(DEPOSIT_AMOUNT, 2)
        expect(count.withdrawalsTotal).toBeCloseTo(WITHDRAWAL_AMOUNT, 2)
        expect(count.expectedAmount).toBeCloseTo(expectedAmount, 2)
        expect(count.difference).toBeCloseTo(0, 2)
    })

    it("no acepta un movimiento sobre una caja ya cerrada", async () => {
        const session = await startFreshCashSession(client, 0)

        await closeCashSession(client, session.id, 0)

        const response = await client.send("POST", `/api/cash-sessions/${session.id}/movements`, {
            type: "deposit",
            amount: 1000,
            concept: "Tarde",
        })

        expect(response.status).toBe(409)
        expect(await listCashMovements(client, session.id)).toHaveLength(0)
    })

    it("no acepta un movimiento sin concepto ni con monto en 0", async () => {
        const session = await startFreshCashSession(client, 0)

        const [withoutConcept, withoutAmount] = await Promise.all([
            client.send("POST", `/api/cash-sessions/${session.id}/movements`, {
                type: "withdrawal",
                amount: 500,
                concept: "   ",
            }),
            client.send("POST", `/api/cash-sessions/${session.id}/movements`, {
                type: "withdrawal",
                amount: 0,
                concept: "Retiro",
            }),
        ])

        expect(withoutConcept.status).toBe(400)
        expect(withoutAmount.status).toBe(400)
        expect(await listCashMovements(client, session.id)).toHaveLength(0)

        await closeCashSession(client, session.id, 0)
    })

    it("responde 404 sobre una caja que no existe", async () => {
        const [read, write] = await Promise.all([
            client.send("GET", "/api/cash-sessions/999999/movements"),
            client.send("POST", "/api/cash-sessions/999999/movements", {
                type: "deposit",
                amount: 100,
                concept: "Fantasma",
            }),
        ])

        expect(read.status).toBe(404)
        expect(write.status).toBe(404)
    })
})
