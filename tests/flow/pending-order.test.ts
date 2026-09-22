import { beforeAll, describe, expect, it } from "vitest"
import { createAuthenticatedClient, type ApiClient } from "./support/api-client"
import {
    closeCashSession,
    createOrder,
    findOpenCashSession,
    findPaymentMethod,
    findProduct,
    payOrder,
    readOrder,
    readStock,
    startFreshCashSession,
    stockOf,
} from "./support/pos"

const PRODUCT = "Porción de papas fritas"

// La composición sembrada del producto: por cada unidad vendida.
const COMPOSITION = [
    { name: "Papa", quantity: 300 },
    { name: "Bandeja de cartón", quantity: 1 },
]

describe("Pedido pendiente", () => {
    let client: ApiClient

    beforeAll(async () => {
        client = await createAuthenticatedClient()

        const leftover = await findOpenCashSession(client)

        // El pedido pendiente se toma sin caja: la caja recién hace falta al cobrar.
        if (leftover) await closeCashSession(client, leftover.id, leftover.opening_amount)
    })

    it("descuenta stock al tomarlo aunque todavía no se haya cobrado", async () => {
        const product = await findProduct(client, PRODUCT)
        const orderedUnits = 3
        const before = await readStock(client)

        const order = await createOrder(client, [{ product_id: product.id, quantity: orderedUnits }], "pending")

        expect(order.status).toBe("pending")
        expect(order.paid_at).toBeNull()
        expect(order.cash_session_id).toBeNull()
        expect(order.payments).toHaveLength(0)

        const after = await readStock(client)

        COMPOSITION.forEach(({ name, quantity }) => {
            expect(stockOf(after, name)).toBeCloseTo(stockOf(before, name) - quantity * orderedUnits, 6)
        })
    })

    it("se cobra después y pasa a cobrado con su fecha, sin volver a tocar el stock", async () => {
        const product = await findProduct(client, PRODUCT)
        const cash = await findPaymentMethod(client, "Efectivo")

        const pending = await createOrder(client, [{ product_id: product.id, quantity: 1 }], "pending")
        const stockAfterTaking = await readStock(client)

        const session = await startFreshCashSession(client, 0)
        const paid = await payOrder(client, pending.id, [
            { payment_method_id: cash.id, amount: pending.sub_total },
        ])

        expect(paid.status).toBe("paid")
        expect(paid.paid_at).not.toBeNull()
        expect(paid.cash_session_id).toBe(session.id)
        expect(paid.total).toBeCloseTo(pending.sub_total * (1 + cash.tax / 100), 2)
        expect(await readStock(client)).toEqual(stockAfterTaking)

        await closeCashSession(client, session.id, 0)
    })

    it("no se puede cobrar dos veces el mismo pedido", async () => {
        const product = await findProduct(client, PRODUCT)
        const cash = await findPaymentMethod(client, "Efectivo")

        const pending = await createOrder(client, [{ product_id: product.id, quantity: 1 }], "pending")
        const session = await startFreshCashSession(client, 0)

        await payOrder(client, pending.id, [{ payment_method_id: cash.id, amount: pending.sub_total }])

        const response = await client.send("POST", `/api/orders/${pending.id}/pay`, {
            payments: [{ payment_method_id: cash.id, amount: pending.sub_total }],
        })

        expect(response.status).toBe(409)
        expect((await readOrder(client, pending.id)).payments).toHaveLength(1)

        await closeCashSession(client, session.id, 0)
    })

    it("no deja cobrar sin una caja abierta", async () => {
        const product = await findProduct(client, PRODUCT)
        const cash = await findPaymentMethod(client, "Efectivo")
        const leftover = await findOpenCashSession(client)

        if (leftover) await closeCashSession(client, leftover.id, leftover.opening_amount)

        const pending = await createOrder(client, [{ product_id: product.id, quantity: 1 }], "pending")

        const response = await client.send("POST", `/api/orders/${pending.id}/pay`, {
            payments: [{ payment_method_id: cash.id, amount: pending.sub_total }],
        })

        expect(response.status).toBe(400)
        expect((await readOrder(client, pending.id)).status).toBe("pending")
    })
})
