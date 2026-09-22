import { beforeAll, describe, expect, it } from "vitest"
import { createAuthenticatedClient, type ApiClient } from "./support/api-client"
import { findSupply, listSupplies, purchase, readStock, stockOf } from "./support/pos"

// Harina y Azúcar no entran en ninguna composición: comprarlas no mueve el costo de
// ningún producto ni el de los otros flujos.
const FLOUR = "Harina"
const SUGAR = "Azúcar"

describe("Compra", () => {
    let client: ApiClient

    beforeAll(async () => {
        client = await createAuthenticatedClient()
    })

    it("suma al stock exactamente lo comprado de cada insumo", async () => {
        const flour = await findSupply(client, FLOUR)
        const sugar = await findSupply(client, SUGAR)
        const before = await readStock(client)

        await purchase(client, [
            { supply_id: flour.id, quantity: 5000, unit_price: 1.35 },
            { supply_id: sugar.id, quantity: 2000, unit_price: 1.9 },
        ])

        const after = await readStock(client)

        expect(stockOf(after, FLOUR)).toBe(stockOf(before, FLOUR) + 5000)
        expect(stockOf(after, SUGAR)).toBe(stockOf(before, SUGAR) + 2000)
    })

    it("deja el precio de compra del insumo en el de la última compra", async () => {
        const flour = await findSupply(client, FLOUR)

        await purchase(client, [{ supply_id: flour.id, quantity: 1000, unit_price: 2.75 }])

        const updated = await findSupply(client, FLOUR)

        expect(updated.purchase_price).toBe(2.75)
    })

    it("no toca el stock de los insumos que no se compraron", async () => {
        const sugar = await findSupply(client, SUGAR)
        const before = await readStock(client)

        await purchase(client, [{ supply_id: sugar.id, quantity: 500, unit_price: 2.1 }])

        const after = await readStock(client)
        const untouched = (await listSupplies(client))
            .filter((supply) => supply.name !== SUGAR)
            .map((supply) => supply.name)

        untouched.forEach((name) => {
            expect(stockOf(after, name)).toBe(stockOf(before, name))
        })
    })

    it("rechaza una compra con un insumo que no existe y no genera movimientos", async () => {
        const before = await readStock(client)

        const response = await client.send("POST", "/api/purchases", {
            supplier_name: null,
            purchased_at: new Date().toISOString(),
            note: null,
            lines: [{ supply_id: 999_999, quantity: 10, unit_price: 5 }],
        })

        expect(response.status).toBe(400)
        expect(await readStock(client)).toEqual(before)
    })
})
