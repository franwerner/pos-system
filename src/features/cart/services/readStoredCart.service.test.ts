import { describe, expect, it } from "vitest"
import { type ProductCartItem } from "../context/cart-context"
import { readStoredCart } from "./readStoredCart.service"

const buildItem = (id: number, quantity: number): ProductCartItem => ({
    id,
    name: `Producto ${id}`,
    description: null,
    img_url: null,
    search_name: `producto ${id}`,
    is_active: true,
    target_margin_percentage: null,
    price: 100,
    quantity,
    category: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
})

describe("readStoredCart", () => {
    it("devuelve un carrito vacío cuando no hay nada guardado", () => {
        expect(readStoredCart(null)).toEqual([])
        expect(readStoredCart("")).toEqual([])
    })

    it("devuelve los ítems guardados cuando el storage es válido", () => {
        const items = [buildItem(1, 2), buildItem(7, 1)]

        expect(readStoredCart(JSON.stringify(items))).toEqual(items)
    })

    it("devuelve un carrito vacío cuando el JSON está corrupto", () => {
        expect(readStoredCart("[{\"id\":1,")).toEqual([])
        expect(readStoredCart("no es json")).toEqual([])
    })

    it("descarta lo que no tiene forma de ítem de carrito", () => {
        expect(readStoredCart(JSON.stringify({ id: 1 }))).toEqual([])
        expect(readStoredCart(JSON.stringify([buildItem(1, 2), { id: 2 }, null]))).toEqual([
            buildItem(1, 2),
        ])
    })
})
