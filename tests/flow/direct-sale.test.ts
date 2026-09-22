import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createAuthenticatedClient, type ApiClient } from "./support/api-client"
import {
    closeCashSession,
    createOrder,
    findPaymentMethod,
    findProduct,
    readStock,
    startFreshCashSession,
    stockOf,
} from "./support/pos"

const PRODUCT = "Hamburguesa clásica"

// La composición sembrada del producto: por cada unidad vendida.
const COMPOSITION = [
    { name: "Carne picada", quantity: 150 },
    { name: "Pan de hamburguesa", quantity: 1 },
    { name: "Queso cheddar", quantity: 40 },
    { name: "Bandeja de cartón", quantity: 1 },
    { name: "Servilleta", quantity: 2 },
]

describe("Venta directa", () => {
    let client: ApiClient
    let cashSessionId: number

    beforeAll(async () => {
        client = await createAuthenticatedClient()
        cashSessionId = (await startFreshCashSession(client, 0)).id
    })

    afterAll(async () => {
        await closeCashSession(client, cashSessionId, 0)
    })

    it("queda cobrada en el momento, con su fecha de cobro y su caja", async () => {
        const product = await findProduct(client, PRODUCT)
        const cash = await findPaymentMethod(client, "Efectivo")
        const subTotal = product.price * 2

        const order = await createOrder(
            client,
            [{ product_id: product.id, quantity: 2 }],
            "paid",
            [{ payment_method_id: cash.id, amount: subTotal }],
        )

        expect(order.status).toBe("paid")
        expect(order.paid_at).not.toBeNull()
        expect(order.cash_session_id).toBe(cashSessionId)
        expect(order.sub_total).toBe(subTotal)
        expect(order.total).toBeCloseTo(subTotal * (1 + cash.tax / 100), 2)
    })

    it("el descuento por efectivo deja cobrado menos que el subtotal", async () => {
        const product = await findProduct(client, PRODUCT)
        const cash = await findPaymentMethod(client, "Efectivo")
        const subTotal = product.price

        const order = await createOrder(
            client,
            [{ product_id: product.id, quantity: 1 }],
            "paid",
            [{ payment_method_id: cash.id, amount: subTotal }],
        )

        expect(cash.tax).toBeLessThan(0)
        expect(order.tax).toBeCloseTo(subTotal * (cash.tax / 100), 2)
        expect(order.total).toBeLessThan(order.sub_total)
    })

    it("descuenta del stock la composición por la cantidad vendida", async () => {
        const product = await findProduct(client, PRODUCT)
        const cash = await findPaymentMethod(client, "Efectivo")
        const soldUnits = 3
        const before = await readStock(client)

        await createOrder(
            client,
            [{ product_id: product.id, quantity: soldUnits }],
            "paid",
            [{ payment_method_id: cash.id, amount: product.price * soldUnits }],
        )

        const after = await readStock(client)

        COMPOSITION.forEach(({ name, quantity }) => {
            expect(stockOf(after, name)).toBeCloseTo(stockOf(before, name) - quantity * soldUnits, 6)
        })
    })

    it("no descuenta nada por un producto sin composición", async () => {
        const coffee = await findProduct(client, "Café")
        const cash = await findPaymentMethod(client, "Efectivo")
        const before = await readStock(client)

        const order = await createOrder(
            client,
            [{ product_id: coffee.id, quantity: 4 }],
            "paid",
            [{ payment_method_id: cash.id, amount: coffee.price * 4 }],
        )

        expect(order.status).toBe("paid")
        expect(await readStock(client)).toEqual(before)
    })

    it("cobra al precio del producto y no al que mande el cliente", async () => {
        const product = await findProduct(client, "Coca-Cola lata")
        const cash = await findPaymentMethod(client, "Efectivo")

        const response = await client.send("POST", "/api/orders", {
            items: [{ product_id: product.id, quantity: 1, unit_price: 1 }],
            status: "paid",
            payments: [{ payment_method_id: cash.id, amount: 1 }],
        })

        expect(response.status).toBe(400)
    })
})
