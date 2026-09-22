import { describe, expect, it } from "vitest"
import { type Payment } from "@/features/payment/types/payment.type"
import { type ProductCartItem } from "../context/cart-context"
import { calculateCart } from "./calculateCart.service"

const buildItem = (id: number, price: number, quantity: number): ProductCartItem => ({
    id,
    name: `Producto ${id}`,
    description: null,
    img_url: null,
    search_name: `producto ${id}`,
    is_active: true,
    target_margin_percentage: null,
    price,
    quantity,
    category: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
})

const buildPayment = (tax: number): Payment => ({
    id: 1,
    name: `Método ${tax}%`,
    tax,
    is_active: true,
})

describe("calculateCart", () => {
    const cart = [
        buildItem(1, 100, 2),
        buildItem(2, 250, 1),
        buildItem(3, 75, 4),
    ]

    it("suma el precio por la cantidad de cada ítem en el subtotal", () => {
        expect(calculateCart(cart, buildPayment(0)).subTotal).toBe(750)
    })

    it("cuenta las unidades de todos los ítems", () => {
        expect(calculateCart(cart, buildPayment(0)).itemCount).toBe(7)
    })

    it("aplica el recargo porcentual del método de pago sobre el subtotal", () => {
        const { taxAmount, total } = calculateCart(cart, buildPayment(10))

        expect(taxAmount).toBe(75)
        expect(total).toBe(825)
    })

    it("aplica el descuento porcentual del método de pago sobre el subtotal", () => {
        const { subTotal, taxAmount, total } = calculateCart(cart, buildPayment(-10))

        expect(subTotal).toBe(750)
        expect(taxAmount).toBe(-75)
        expect(total).toBe(675)
        expect(total).toBeLessThan(subTotal)
    })

    it("deja el total igual al subtotal cuando el ajuste es 0", () => {
        const { subTotal, taxAmount, total } = calculateCart(cart, buildPayment(0))

        expect(taxAmount).toBe(0)
        expect(total).toBe(subTotal)
    })

    it("calcula sobre precios con decimales", () => {
        const decimalCart = [buildItem(1, 250.5, 3)]
        const { subTotal, taxAmount, total } = calculateCart(decimalCart, buildPayment(15))

        expect(subTotal).toBeCloseTo(751.5, 2)
        expect(taxAmount).toBeCloseTo(112.725, 3)
        expect(total).toBeCloseTo(864.225, 3)
    })

    it("devuelve todo en cero con el carrito vacío", () => {
        expect(calculateCart([], buildPayment(10))).toEqual({
            subTotal: 0,
            taxAmount: 0,
            total: 0,
            itemCount: 0,
        })
    })
})
