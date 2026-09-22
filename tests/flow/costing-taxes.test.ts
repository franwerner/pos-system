import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { type PatchConfigInput } from "@/features/admin/hooks/usePatchConfig.hook"
import { type ProductCostingRow } from "@/features/costing/services/calculateProductCosting.service"
import { type CostingReport } from "@/features/costing/types/costing.type"
import { createAuthenticatedClient, type ApiClient } from "./support/api-client"
import {
    createTax,
    deleteTax,
    findPaymentMethod,
    patchConfig,
    patchProductTargetMargin,
    patchTax,
    readCosting,
    readCostingParams,
    suspendTaxes,
} from "./support/pos"

const PRODUCT = "Hamburguesa clásica"

const currentMonth = (): string => new Date().toISOString().slice(0, 7)

const readReport = (client: ApiClient): Promise<CostingReport> => readCosting(client, currentMonth())

const findRow = (report: CostingReport): ProductCostingRow => {
    const row = report.rows.find((item) => item.name === PRODUCT)

    if (!row?.costing) throw new Error(`El producto "${PRODUCT}" no está costeado`)

    return row
}

const readProduct = async (client: ApiClient): Promise<ProductCostingRow> =>
    findRow(await readReport(client))

describe("Costeo con impuestos configurables", () => {
    let client: ApiClient
    let originalParams: PatchConfigInput
    let restoreTaxes: () => Promise<void>
    const createdTaxIds: number[] = []

    const loadTax = async (input: Parameters<typeof createTax>[1]) => {
        const tax = await createTax(client, input)

        createdTaxIds.push(tax.id)

        return tax
    }

    beforeAll(async () => {
        client = await createAuthenticatedClient()
        originalParams = await readCostingParams(client)
        restoreTaxes = await suspendTaxes(client)
    })

    afterEach(async () => {
        while (createdTaxIds.length > 0) await deleteTax(client, createdTaxIds.pop()!)
        await patchConfig(client, originalParams)
    })

    afterAll(async () => {
        await restoreTaxes()
        await patchConfig(client, originalParams)
    })

    it("sin impuestos cargados costea con los importes finales", async () => {
        const report = await readReport(client)
        const row = findRow(report)

        expect(report.active_taxes).toEqual([])
        expect(report.tax).toEqual({
            purchase_rate: 0,
            sale_rate: 0,
            payment_rate: 0,
            profit_rate: 0,
            monthly_fixed_amount: 0,
        })
        expect(row.costing!.net_price).toBe(row.price)
        expect(row.costing!.sale_tax_amount).toBe(0)
        expect(row.costing!.contribution_margin)
            .toBeCloseTo(row.price - row.costing!.variable_cost, 6)
    })

    it("con IVA compras recuperable e IVA ventas los números bajan como con responsable inscripto", async () => {
        const gross = await readProduct(client)

        await loadTax({ name: "IVA compras", type: "purchase", rate: 21, is_recoverable: true })
        await loadTax({ name: "IVA ventas", type: "sale", rate: 21 })

        const net = await readProduct(client)

        expect(net.costing!.net_price).toBeCloseTo(gross.price / 1.21, 4)
        expect(net.costing!.variable_cost).toBeCloseTo(gross.costing!.variable_cost / 1.21, 4)
        expect(net.costing!.contribution_margin).toBeLessThan(gross.costing!.contribution_margin)
    })

    it("un impuesto de compra que no se recupera queda adentro del costo del insumo", async () => {
        const before = await readProduct(client)

        await loadTax({ name: "Percepción no recuperable", type: "purchase", rate: 21 })

        const after = await readProduct(client)

        expect(after.costing!.variable_cost).toBeCloseTo(before.costing!.variable_cost, 6)
    })

    it("un impuesto sobre la ganancia se aplica recién después de restar todos los costos", async () => {
        const before = await readProduct(client)

        await loadTax({ name: "Ganancias", type: "profit", rate: 35 })

        const after = await readProduct(client)

        expect(after.costing!.gross_profit).toBeCloseTo(before.costing!.net_margin, 6)
        expect(after.costing!.profit_tax_amount)
            .toBeCloseTo(after.costing!.gross_profit * 0.35, 6)
        expect(after.costing!.net_margin)
            .toBeCloseTo(after.costing!.gross_profit * 0.65, 6)
    })

    it("una comisión por medio de pago se descuenta del precio junto con los impuestos de venta", async () => {
        const credit = await findPaymentMethod(client, "Crédito")

        await loadTax({
            name: "Comisión de tarjeta",
            type: "payment",
            rate: 6,
            payment_method_id: credit.id,
        })

        const report = await readReport(client)
        const row = findRow(report)

        expect(report.tax.payment_rate).toBeGreaterThan(0)
        expect(report.tax.payment_rate).toBeLessThanOrEqual(6)
        expect(row.costing!.net_price)
            .toBeCloseTo(row.price / (1 + report.tax.payment_rate / 100), 6)
    })

    it("un impuesto desactivado deja de entrar en el costeo", async () => {
        const before = await readProduct(client)
        const tax = await loadTax({ name: "IVA ventas", type: "sale", rate: 21 })

        expect((await readProduct(client)).costing!.net_price).toBeLessThan(before.price)

        await patchTax(client, { id: tax.id, is_active: false })

        expect((await readProduct(client)).costing!.net_price).toBe(before.price)
    })
})

describe("Costos fijos por unidad y precio sugerido", () => {
    let client: ApiClient
    let originalParams: PatchConfigInput
    let restoreTaxes: () => Promise<void>
    let originalMargin: number | null = null

    const setMargin = async (targetMarginPercentage: number | null) => {
        const { product_id: productId } = await readProduct(client)

        await patchProductTargetMargin(client, productId, targetMarginPercentage)
    }

    beforeAll(async () => {
        client = await createAuthenticatedClient()
        originalParams = await readCostingParams(client)
        originalMargin = (await readProduct(client)).target_margin_percentage
        restoreTaxes = await suspendTaxes(client)
    })

    afterAll(async () => {
        await restoreTaxes()
        await patchConfig(client, originalParams)
        await setMargin(originalMargin)
    })

    it("nunca reparte los costos fijos del mes en curso", async () => {
        const report = await readReport(client)

        expect(report.fixed_cost_per_unit.months).not.toContain(currentMonth())

        if (report.fixed_cost_per_unit.confidence === "preliminary") {
            expect(report.fixed_cost_per_unit.amount_per_unit).toBe(0)
            expect(findRow(report).costing!.total_cost)
                .toBeCloseTo(findRow(report).costing!.variable_cost, 6)
        }
    })

    it("el costo fijo por unidad que informa el reporte es el que carga cada producto", async () => {
        const report = await readReport(client)

        expect(findRow(report).costing!.fixed_cost_amount)
            .toBeCloseTo(report.fixed_cost_per_unit.amount_per_unit, 6)
    })

    it("el precio sugerido es el costo total llevado al margen objetivo del producto", async () => {
        await setMargin(60)

        const costing = (await readProduct(client)).costing!

        expect(costing.target_margin_percentage).toBe(60)
        expect(costing.suggested_price).toBeCloseTo(costing.total_cost / 0.4, 4)
        expect(costing.suggested_price_difference)
            .toBeCloseTo(costing.suggested_price! - costing.price, 6)
    })

    it("un producto sin margen objetivo no tiene precio sugerido", async () => {
        await setMargin(null)

        const costing = (await readProduct(client)).costing!

        expect(costing.target_margin_percentage).toBeNull()
        expect(costing.suggested_price).toBeNull()
        expect(costing.suggested_price_difference).toBeNull()
        expect(costing.total_cost).toBeGreaterThan(0)
    })

    it("un margen objetivo más alto pide un precio más alto", async () => {
        await setMargin(40)
        const low = (await readProduct(client)).costing!.suggested_price!

        await setMargin(80)
        const high = (await readProduct(client)).costing!.suggested_price!

        expect(high).toBeGreaterThan(low)
    })

    it("el precio sugerido sube lo que el precio va a perder en impuestos sobre la venta", async () => {
        await setMargin(60)
        const withoutTax = (await readProduct(client)).costing!.suggested_price!

        const tax = await createTax(client, { name: "IVA ventas", type: "sale", rate: 21 })

        try {
            expect((await readProduct(client)).costing!.suggested_price)
                .toBeCloseTo(withoutTax * 1.21, 4)
        } finally {
            await deleteTax(client, tax.id)
        }
    })
})
