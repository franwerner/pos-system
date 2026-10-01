"use client"

import { ChevronDown } from "lucide-react"
import { memo, useState } from "react"
import { type ProductCartItem, useCart } from "@/features/cart/context/cart-context"
import { resolveCategoryVisual } from "@/features/products/services/resolveCategoryVisual.service"
import { Money } from "@/shared/components/money.component"
import { ProductPlate } from "@/shared/components/product-plate.component"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/utils/cn.util"
import OrderAmount from "./order-amount.component"

const MAX_VISIBLE = 3

export const ProductSummaryItem = memo(({ item }: { item: ProductCartItem }) => {
    const visual = resolveCategoryVisual(item.category?.name)

    return (
        <div className="flex items-center gap-3 border-b border-border py-3 last:border-0">
            <ProductPlate
                size="md"
                imageUrl={item.img_url ?? undefined}
                icon={visual.icon}
                tone={visual.tone}
                alt={item.name}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-semibold">{item.name}</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                    <Money value={item.price} size="sm" tone="muted" className="font-normal" /> × {item.quantity}
                </span>
            </div>
            <Money value={item.price * item.quantity} className="text-lg" />
        </div>
    )
})
ProductSummaryItem.displayName = "ProductSummaryItem"

// Con más de 3 productos se colapsa: arranca mostrando solo los primeros 3, igual
// que el diseño, en vez de un acordeón con animación que no aporta acá.
const ProductsSummary = () => {
    const { cart } = useCart()
    const [open, setOpen] = useState(false)
    const hiddenCount = Math.max(cart.length - MAX_VISIBLE, 0)

    return (
        <div className="flex flex-col">
            {cart.slice(0, MAX_VISIBLE).map((item) => (
                <ProductSummaryItem item={item} key={item.id} />
            ))}
            {open && cart.slice(MAX_VISIBLE).map((item) => (
                <ProductSummaryItem item={item} key={item.id} />
            ))}
            {hiddenCount > 0 && (
                <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className="mt-1.5 h-12 w-full gap-2"
                    onClick={() => setOpen((value) => !value)}
                >
                    <ChevronDown className={cn("size-5 transition-transform duration-200", open && "rotate-180")} aria-hidden />
                    {open ? "Ver menos" : `Ver ${hiddenCount} productos más`}
                </Button>
            )}
        </div>
    )
}

export default function OrderSummary() {
    return (
        <div className="flex flex-col gap-0 rounded-xl border border-border bg-card p-0">
            <h2 className="px-5 pb-1.5 pt-[18px] text-lg font-bold">Resumen del pedido</h2>
            <div className="px-5">
                <ProductsSummary />
            </div>
            <div className="flex flex-col gap-1 px-5 pb-[18px] pt-3.5">
                <OrderAmount />
            </div>
        </div>
    )
}
