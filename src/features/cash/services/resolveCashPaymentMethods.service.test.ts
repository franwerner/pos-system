import { describe, expect, it } from "vitest"
import { resolveCashPaymentMethodIds } from "./resolveCashPaymentMethods.service"

const paymentMethods = [
    { id: 1, name: "Efectivo" },
    { id: 2, name: "Débito" },
    { id: 3, name: "Crédito" },
]

describe("resolveCashPaymentMethodIds", () => {
    it("reconoce el método de pago que se llama efectivo", () => {
        expect(resolveCashPaymentMethodIds(paymentMethods, 2)).toEqual([1])
    })

    it("ignora mayúsculas y acentos del nombre", () => {
        expect(resolveCashPaymentMethodIds([{ id: 7, name: " EFECTIVO " }], null)).toEqual([7])
    })

    it("cae en el método por defecto de la config cuando ninguno se llama efectivo", () => {
        const methods = [{ id: 4, name: "Contado" }, { id: 5, name: "Transferencia" }]

        expect(resolveCashPaymentMethodIds(methods, 4)).toEqual([4])
    })

    it("no toma un método por defecto que no está en la lista", () => {
        expect(resolveCashPaymentMethodIds([{ id: 4, name: "Contado" }], 99)).toEqual([])
    })

    it("sin nombre ni config no hay método en efectivo", () => {
        expect(resolveCashPaymentMethodIds([{ id: 4, name: "Contado" }], null)).toEqual([])
    })
})
