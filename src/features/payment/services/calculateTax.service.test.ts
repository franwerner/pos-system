import { describe, expect, it } from "vitest"
import { calculateTax } from "./calculateTax.service"

describe("calculateTax", () => {
    it("calcula el recargo porcentual y lo suma al monto", () => {
        expect(calculateTax(750, 10)).toEqual({ tax: 75, total: 825 })
    })

    it("un porcentaje negativo descuenta en vez de recargar", () => {
        expect(calculateTax(750, -10)).toEqual({ tax: -75, total: 675 })
    })

    it("el total con descuento queda por debajo del monto", () => {
        const { total } = calculateTax(1000, -10)

        expect(total).toBeLessThan(1000)
    })

    it("no altera el monto cuando el ajuste es 0", () => {
        expect(calculateTax(750, 0)).toEqual({ tax: 0, total: 750 })
    })

    it("soporta recargos con decimales", () => {
        const { tax, total } = calculateTax(1200, 2.5)

        expect(tax).toBeCloseTo(30, 2)
        expect(total).toBeCloseTo(1230, 2)
    })

    it("soporta descuentos con decimales", () => {
        const { tax, total } = calculateTax(1200, -2.5)

        expect(tax).toBeCloseTo(-30, 2)
        expect(total).toBeCloseTo(1170, 2)
    })
})
