import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { calculateWastePercentage } from "@/features/costing/services/calculateWastePercentage.service"
import { createAuthenticatedClient, type ApiClient } from "./support/api-client"
import {
    closeCashSession,
    createOrder,
    findPaymentMethod,
    findProduct,
    findSupply,
    listStockMovements,
    readCosting,
    readConfig,
    registerAdjustment,
    registerWaste,
    startFreshCashSession,
    supplyUnitCost,
} from "./support/pos"

const PRODUCT = "Hamburguesa clásica"
const WASTED_SUPPLY = "Carne picada"

const currentMonth = (): string => new Date().toISOString().slice(0, 7)

/** La merma que el costeo tendría que informar, leída de los movimientos crudos del mes. */
const expectedWaste = async (client: ApiClient) => {
    const month = currentMonth()
    const movements = (await listStockMovements(client))
        .filter((movement) => movement.created_at.slice(0, 7) === month)

    return calculateWastePercentage(movements, (await readConfig(client)).waste_percentage_food)
}

const sell = async (client: ApiClient, quantity: number) => {
    const product = await findProduct(client, PRODUCT)
    const cash = await findPaymentMethod(client, "Efectivo")

    await createOrder(
        client,
        [{ product_id: product.id, quantity }],
        "paid",
        [{ payment_method_id: cash.id, amount: product.price * quantity }],
    )
}

describe("Merma real del costeo", () => {
    let client: ApiClient
    let cashSessionId: number

    beforeAll(async () => {
        client = await createAuthenticatedClient()
        cashSessionId = (await startFreshCashSession(client, 0)).id
    })

    afterAll(async () => {
        await closeCashSession(client, cashSessionId, 0)
    })

    it("mide la merma del mes contra el consumo real y la marca como real", async () => {
        await sell(client, 4)
        await registerWaste(client, (await findSupply(client, WASTED_SUPPLY)).id, 500, "Se cortó la cadena de frío")

        const expected = await expectedWaste(client)
        const report = await readCosting(client, currentMonth())

        expect(report.measured_waste.basis).toBe("real")
        expect(report.measured_waste.waste_cost).toBeGreaterThan(0)
        expect(report.measured_waste.consumption_cost).toBeCloseTo(expected.consumption_cost, 4)
        expect(report.measured_waste.percentage).toBeCloseTo(expected.percentage, 6)
    })

    it("valúa la merma al costo del insumo perdido", async () => {
        const supply = await findSupply(client, WASTED_SUPPLY)
        const lostQuantity = 250

        const before = await readCosting(client, currentMonth())
        await registerWaste(client, supply.id, lostQuantity, "Se cayó la bandeja")
        const after = await readCosting(client, currentMonth())

        // El costo del movimiento se guarda con 4 decimales: contra el costo exacto
        // del insumo la diferencia queda por debajo del centavo.
        expect(after.measured_waste.waste_cost - before.measured_waste.waste_cost)
            .toBeCloseTo(lostQuantity * supplyUnitCost(supply), 1)
        expect(after.measured_waste.percentage).toBeGreaterThan(before.measured_waste.percentage)
    })

    it("no cuenta un ajuste negativo como merma", async () => {
        const supply = await findSupply(client, WASTED_SUPPLY)

        const before = await readCosting(client, currentMonth())
        await registerAdjustment(client, supply.id, 300, "Faltante de inventario")
        const after = await readCosting(client, currentMonth())

        expect(after.measured_waste.waste_cost).toBeCloseTo(before.measured_waste.waste_cost, 6)
        expect(after.measured_waste.percentage).toBeCloseTo(before.measured_waste.percentage, 6)
    })
})
