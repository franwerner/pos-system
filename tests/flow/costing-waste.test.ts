import { afterAll, beforeAll, describe, expect, it } from "vitest"
import {
    calculateWasteByType,
    type MeasuredWasteByType,
    type TypedCostedMovement,
} from "@/features/costing/services/calculateWasteByType.service"
import { type SupplyType } from "@/features/supplies/types/supply.type"
import { createAuthenticatedClient, type ApiClient } from "./support/api-client"
import {
    closeCashSession,
    createOrder,
    findPaymentMethod,
    findProduct,
    findSupply,
    listStockMovements,
    listSupplies,
    readConfig,
    readCosting,
    readMeasuredParameters,
    registerAdjustment,
    registerWaste,
    startFreshCashSession,
    supplyUnitCost,
} from "./support/pos"

const PRODUCT = "Hamburguesa clásica"
const WASTED_FOOD = "Carne picada"
const WASTED_PACKAGING = "Bandeja de cartón"

const currentMonth = (): string => new Date().toISOString().slice(0, 7)

/** La merma que el costeo tendría que informar, leída de los movimientos crudos del mes. */
const expectedWaste = async (client: ApiClient): Promise<MeasuredWasteByType> => {
    const month = currentMonth()
    const supplyType = new Map((await listSupplies(client)).map((supply) => [supply.id, supply.type]))
    const config = await readConfig(client)

    const movements: TypedCostedMovement[] = (await listStockMovements(client))
        .filter((movement) => movement.created_at.slice(0, 7) === month)
        .map((movement) => ({
            type: movement.type,
            quantity: movement.quantity,
            unit_cost: movement.unit_cost,
            supply_type: supplyType.get(movement.supply_id) as SupplyType,
        }))

    return calculateWasteByType(movements, {
        food: config.waste_percentage_food,
        drink: config.waste_percentage_drink,
        packaging: config.waste_percentage_packaging,
    })
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
        await registerWaste(client, (await findSupply(client, WASTED_FOOD)).id, 500, "Se cortó la cadena de frío")

        const expected = await expectedWaste(client)
        const report = await readCosting(client, currentMonth())

        expect(report.measured_waste.food.basis).toBe("real")
        expect(report.measured_waste.food.waste_cost).toBeGreaterThan(0)
        expect(report.measured_waste.food.consumption_cost).toBeCloseTo(expected.food.consumption_cost, 4)
        expect(report.measured_waste.food.percentage).toBeCloseTo(expected.food.percentage, 6)
    })

    it("valúa la merma al costo del insumo perdido", async () => {
        const supply = await findSupply(client, WASTED_FOOD)
        const lostQuantity = 250

        const before = await readCosting(client, currentMonth())
        await registerWaste(client, supply.id, lostQuantity, "Se cayó la bandeja")
        const after = await readCosting(client, currentMonth())

        // El costo del movimiento se guarda con 4 decimales: contra el costo exacto
        // del insumo la diferencia queda por debajo del centavo.
        expect(after.measured_waste.food.waste_cost - before.measured_waste.food.waste_cost)
            .toBeCloseTo(lostQuantity * supplyUnitCost(supply), 1)
        expect(after.measured_waste.food.percentage).toBeGreaterThan(before.measured_waste.food.percentage)
    })

    it("no cuenta un ajuste negativo como merma", async () => {
        const supply = await findSupply(client, WASTED_FOOD)

        const before = await readCosting(client, currentMonth())
        await registerAdjustment(client, supply.id, 300, "Faltante de inventario")
        const after = await readCosting(client, currentMonth())

        expect(after.measured_waste.food.waste_cost).toBeCloseTo(before.measured_waste.food.waste_cost, 6)
        expect(after.measured_waste.food.percentage).toBeCloseTo(before.measured_waste.food.percentage, 6)
    })

    it("mide cada tipo de insumo por separado", async () => {
        const packaging = await findSupply(client, WASTED_PACKAGING)

        const before = await readCosting(client, currentMonth())
        await registerWaste(client, packaging.id, 10, "Se mojó la caja")
        const after = await readCosting(client, currentMonth())

        expect(after.measured_waste.packaging.waste_cost - before.measured_waste.packaging.waste_cost)
            .toBeCloseTo(10 * supplyUnitCost(packaging), 1)
        expect(after.measured_waste.food.waste_cost).toBeCloseTo(before.measured_waste.food.waste_cost, 6)
        expect(after.measured_waste.food.percentage).toBeCloseTo(before.measured_waste.food.percentage, 6)
    })

    it("los tres tipos vienen siempre, con su base", async () => {
        const measured = (await readMeasuredParameters(client, currentMonth())).waste

        expect(Object.keys(measured).sort()).toEqual(["drink", "food", "packaging"])
        expect(measured.food.basis).toBe("real")
        expect(["real", "estimated"]).toContain(measured.drink.basis)
    })

    it("lo medido de la pantalla es lo mismo que informa el reporte", async () => {
        const measured = await readMeasuredParameters(client, currentMonth())
        const report = await readCosting(client, currentMonth())

        expect(measured.waste).toEqual(report.measured_waste)
    })
})
