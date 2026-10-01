"use client"

import { memo } from "react"
import { useCart } from "@/features/cart/context/cart-context"
import { Money } from "@/shared/components/money.component"
import { ProductPlate } from "@/shared/components/product-plate.component"
import { cn } from "@/shared/utils/cn.util"
import { resolveCategoryVisual } from "../services/resolveCategoryVisual.service"
import { type Product } from "../types/product.type"

interface ProductProps {
    product: Product
    addToCart: (product: Product) => void
}

/** Tarjeta de producto de la grilla: un toque suma 1. Si ya está en el pedido, borde de marca + cantidad. */
const ProductCard = memo(({ product, addToCart }: ProductProps) => {
    const { cart } = useCart()
    const inOrder = cart.find((item) => item.id === product.id)?.quantity ?? 0
    const { icon, tone } = resolveCategoryVisual(product.category?.name)

    return (
        <button
            type="button"
            onClick={() => addToCart(product)}
            aria-label={inOrder > 0 ? `Sumar ${product.name} (hay ${inOrder} en el pedido)` : `Sumar ${product.name}`}
            className={cn(
                "relative flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-3.5 text-center text-foreground shadow-sm",
                inOrder > 0 && "border-brand ring-2 ring-accent",
            )}
        >
            {inOrder > 0 && (
                <span className="absolute right-2.5 top-2.5 flex h-[30px] min-w-[30px] items-center justify-center rounded-full bg-primary px-2 text-[15px] font-extrabold text-primary-foreground tabular-nums">
                    {inOrder}
                </span>
            )}
            <ProductPlate size="lg" icon={icon} tone={tone} imageUrl={product.img_url ?? undefined} alt={product.name} />
            <span
                style={{ wordBreak: "break-word" }}
                className="flex min-h-10 items-center text-base font-semibold leading-tight"
            >
                {product.name}
            </span>
            <Money value={product.price} className="text-[22px] font-extrabold" />
        </button>
    )
})
ProductCard.displayName = "ProductCard"

export default ProductCard
