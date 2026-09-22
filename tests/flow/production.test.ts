import { beforeAll, describe, expect, it } from "vitest"
import { createAuthenticatedClient, type ApiClient } from "./support/api-client"
import { findSupply, produce, readStock, stockOf, supplyUnitCost } from "./support/pos"

const PREPARED = "Milanesa cruda"

// La composición sembrada del preparado: por cada unidad producida.
const COMPONENTS = [
    { name: "Carne picada", quantity: 120 },
    { name: "Pan rallado", quantity: 40 },
    { name: "Huevo", quantity: 0.25 },
]

describe("Producción", () => {
    let client: ApiClient

    beforeAll(async () => {
        client = await createAuthenticatedClient()
    })

    it("consume los componentes en la proporción de la composición y da de alta el preparado", async () => {
        const prepared = await findSupply(client, PREPARED)
        const before = await readStock(client)
        const producedUnits = 5

        await produce(client, prepared.id, producedUnits)

        const after = await readStock(client)

        COMPONENTS.forEach(({ name, quantity }) => {
            expect(stockOf(after, name)).toBeCloseTo(stockOf(before, name) - quantity * producedUnits, 6)
        })

        expect(stockOf(after, PREPARED)).toBe(stockOf(before, PREPARED) + producedUnits)
    })

    it("valúa el preparado al costo de sus componentes", async () => {
        const prepared = await findSupply(client, PREPARED)

        const expectedUnitCost = (await Promise.all(
            COMPONENTS.map(async ({ name, quantity }) =>
                quantity * supplyUnitCost(await findSupply(client, name))),
        )).reduce((total, cost) => total + cost, 0)

        const { unit_cost } = await produce(client, prepared.id, 8)

        expect(unit_cost).toBeCloseTo(expectedUnitCost, 6)
    })

    it("rechaza producir un insumo comprado y no mueve stock", async () => {
        const purchased = await findSupply(client, "Carne picada")
        const before = await readStock(client)

        const response = await client.send("POST", "/api/production", {
            supply_id: purchased.id,
            quantity: 3,
            produced_at: new Date().toISOString(),
            note: null,
        })

        expect(response.status).toBe(400)
        expect(await readStock(client)).toEqual(before)
    })
})
