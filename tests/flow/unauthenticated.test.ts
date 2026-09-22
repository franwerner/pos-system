import { beforeAll, describe, expect, it } from "vitest"
import { createAnonymousClient, createAuthenticatedClient, type ApiClient } from "./support/api-client"
import { findPaymentMethod, findProduct, findSupply, listCashSessions, listOrders, readStock } from "./support/pos"

describe("Sin sesión", () => {
    let client: ApiClient
    const anonymous = createAnonymousClient()

    beforeAll(async () => {
        client = await createAuthenticatedClient()
    })

    it("responde 401 en todo lo que se puede leer", async () => {
        const paths = [
            "/api/auth/me",
            "/api/products",
            "/api/supplies",
            "/api/stock",
            "/api/orders",
            "/api/purchases",
            "/api/production",
            "/api/payment-methods",
            "/api/cash-sessions",
            "/api/costing",
            "/api/config",
        ]

        const responses = await Promise.all(paths.map((path) => anonymous.send("GET", path)))

        responses.forEach((response, index) => {
            expect(response.status, `GET ${paths[index]}`).toBe(401)
        })
    })

    it("responde 401 y no deja rastro en la base al intentar escribir", async () => {
        const product = await findProduct(client, "Café")
        const supply = await findSupply(client, "Harina")
        const cash = await findPaymentMethod(client, "Efectivo")

        const ordersBefore = await listOrders(client)
        const sessionsBefore = await listCashSessions(client)
        const stockBefore = await readStock(client)

        const attempts = [
            anonymous.send("POST", "/api/orders", {
                items: [{ product_id: product.id, quantity: 1 }],
                status: "paid",
                payments: [{ payment_method_id: cash.id, amount: product.price }],
            }),
            anonymous.send("POST", "/api/purchases", {
                supplier_name: "Intruso",
                purchased_at: new Date().toISOString(),
                note: null,
                lines: [{ supply_id: supply.id, quantity: 1000, unit_price: 1 }],
            }),
            anonymous.send("POST", "/api/cash-sessions", { opening_amount: 999_999, note: null }),
            anonymous.send("POST", "/api/stock/movements", {
                supply_id: supply.id,
                type: "adjustment",
                quantity: 5000,
                direction: "in",
                note: null,
            }),
            anonymous.send("PATCH", "/api/payment-methods", { id: cash.id, tax: 99 }),
        ]

        const responses = await Promise.all(attempts)

        responses.forEach((response) => expect(response.status).toBe(401))

        expect((await listOrders(client)).length).toBe(ordersBefore.length)
        expect((await listCashSessions(client)).length).toBe(sessionsBefore.length)
        expect(await readStock(client)).toEqual(stockBefore)
        expect((await findPaymentMethod(client, "Efectivo")).tax).toBe(cash.tax)
    })

    it("responde 401 con una cookie de sesión inventada", async () => {
        const response = await fetch(`${process.env.FLOW_BASE_URL}/api/orders`, {
            headers: { cookie: "pos_session=no-es-un-token" },
        })

        expect(response.status).toBe(401)
    })

    it("deja pasar el login, que es el único endpoint público", async () => {
        const response = await anonymous.send<{ error: string }>("POST", "/api/auth/login", {
            username: "no-existe",
            password: "tampoco",
        })

        // El mensaje prueba que contestó el handler y no el middleware: el login se
        // atiende sin sesión, solo que estas credenciales no valen.
        expect(response.status).toBe(401)
        expect(response.body.error).toMatch(/usuario o contraseña/i)
    })
})
