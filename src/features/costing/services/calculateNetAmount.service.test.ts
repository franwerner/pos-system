import { describe, expect, it } from "vitest"
import { NO_TAXES, type TaxContext } from "@/features/taxes/types/tax.type"
import {
    calculateNetAmount,
    grossSaleAmount,
    netPurchaseAmount,
    netSaleAmount,
    saleDeductionRate,
} from "./calculateNetAmount.service"

const responsableInscripto: TaxContext = {
    purchase_rate: 10.5,
    sale_rate: 21,
    payment_rate: 0,
    profit_rate: 0,
    monthly_fixed_amount: 0,
}

describe("calculateNetAmount", () => {
    it("saca el impuesto de un importe final", () => {
        expect(calculateNetAmount(1210, 21)).toBeCloseTo(1000, 10)
        expect(calculateNetAmount(1105, 10.5)).toBeCloseTo(1000, 10)
    })

    it("deja el importe igual cuando la tasa es 0", () => {
        expect(calculateNetAmount(1210, 0)).toBe(1210)
    })

    it("rechaza importes y tasas inválidas", () => {
        expect(() => calculateNetAmount(-1, 21)).toThrowError(/importe/)
        expect(() => calculateNetAmount(1210, -1)).toThrowError(/tasa/)
    })
})

describe("netPurchaseAmount y netSaleAmount", () => {
    it("sin impuestos cargados no toca ningún importe", () => {
        expect(netPurchaseAmount(1210, NO_TAXES)).toBe(1210)
        expect(netSaleAmount(5000, NO_TAXES)).toBe(5000)
    })

    it("netea cada importe con la tasa de su propio paso", () => {
        expect(netPurchaseAmount(1105, responsableInscripto)).toBeCloseTo(1000, 10)
        expect(netSaleAmount(1210, responsableInscripto)).toBeCloseTo(1000, 10)
    })

    it("del precio se descuentan juntos el impuesto a la venta y la comisión del medio de pago", () => {
        const conComision: TaxContext = { ...responsableInscripto, payment_rate: 3 }

        expect(saleDeductionRate(conComision)).toBe(24)
        expect(netSaleAmount(1240, conComision)).toBeCloseTo(1000, 10)
    })

    it("el bruto es la vuelta exacta del neto", () => {
        const conComision: TaxContext = { ...responsableInscripto, payment_rate: 3 }

        expect(grossSaleAmount(netSaleAmount(5000, conComision), conComision)).toBeCloseTo(5000, 10)
    })
})
