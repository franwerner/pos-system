import { type ProductCartItem } from "../context/cart-context"

export const CART_STORAGE_KEY = "cart"

const isCartItem = (value: unknown): value is ProductCartItem => {
    if (typeof value !== "object" || value === null) return false

    const item = value as Partial<ProductCartItem>

    return typeof item.id === "number"
        && typeof item.price === "number"
        && typeof item.quantity === "number"
}

export const readStoredCart = (raw: string | null): ProductCartItem[] => {
    if (!raw) return []

    try {
        const parsed: unknown = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []

        return parsed.filter(isCartItem)
    } catch {
        return []
    }
}
