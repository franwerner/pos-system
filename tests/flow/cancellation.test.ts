import { beforeAll, describe, expect, it } from "vitest"
import { createAuthenticatedClient, type ApiClient } from "./support/api-client"
import {
    cancelOrder,
    closeCashSession,
    createOrder,
    findOpenCashSession,
    findPaymentMethod,
    findProduct,
    payOrder,
    readOrder,
    readStock,
    startFreshCashSession,
} from "./support/pos"

const PRODUCT = "Hamburguesa doble"

describe("Cancelación", () => {
    let client: ApiClient

    beforeAll(async () => {
        client = await createAuthenticatedClient()

        const leftover = await findOpenCashSession(client)

        if (leftover) await closeCashSession(client, leftover.id, leftover.opening_amount)
    })

    it("devuelve el stock al valor que tenía antes de tomar el pedido", async () => {
        const product = await findProduct(client, PRODUCT)
        const before = await readStock(client)

        const order = await createOrder(client, [{ product_id: product.id, quantity: 2 }], "pending")

        expect(await readStock(client)).not.toEqual(before)

        const cancelled = await cancelOrder(client, order.id)

        expect(cancelled.status).toBe("cancelled")
        expect(await readStock(client)).toEqual(before)
    })

    it("no cancela un pedido ya cobrado", async () => {
        const product = await findProduct(client, PRODUCT)
        const cash = await findPaymentMethod(client, "Efectivo")
        const session = await startFreshCashSession(client, 0)

        const order = await createOrder(client, [{ product_id: product.id, quantity: 1 }], "pending")

        await payOrder(client, order.id, [{ payment_method_id: cash.id, amount: order.sub_total }])

        const stockAfterPaying = await readStock(client)
        const response = await client.send("POST", `/api/orders/${order.id}/cancel`)

        expect(response.status).toBe(409)
        expect((await readOrder(client, order.id)).status).toBe("paid")
        expect(await readStock(client)).toEqual(stockAfterPaying)

        await closeCashSession(client, session.id, 0)
    })

    it("no cancela dos veces el mismo pedido ni duplica la devolución de stock", async () => {
        const product = await findProduct(client, PRODUCT)
        const order = await createOrder(client, [{ product_id: product.id, quantity: 1 }], "pending")

        await cancelOrder(client, order.id)

        const stockAfterCancelling = await readStock(client)
        const response = await client.send("POST", `/api/orders/${order.id}/cancel`)

        expect(response.status).toBe(409)
        expect(await readStock(client)).toEqual(stockAfterCancelling)
    })
})
