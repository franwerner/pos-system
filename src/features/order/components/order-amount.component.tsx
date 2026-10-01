"use client"

import { useCart } from "@/features/cart/context/cart-context"
import { Money } from "@/shared/components/money.component"

// El ajuste depende de cómo se reparta el cobro, y eso se decide recién en el
// checkout: acá el carrito solo puede mostrar lo que valen los productos.
export default function OrderAmount() {
    const { getCalculatedCart } = useCart()
    const { subTotal, itemCount } = getCalculatedCart()

    return (
        <>
            <div className="flex justify-between text-muted-foreground">
                <span>Items</span>
                <span className="font-semibold text-foreground tabular-nums">{itemCount}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="font-semibold">Subtotal</span>
                <Money value={subTotal} size="lg" className="text-[26px]" />
            </div>
        </>
    )
}
