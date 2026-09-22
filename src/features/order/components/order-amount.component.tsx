"use client"

import { useCart } from "@/features/cart/context/cart-context";
import formatCurrency from "@/shared/utils/formatCurrency.util";

// El ajuste depende de cómo se reparta el cobro, y eso se decide recién en el
// checkout: acá el carrito solo puede mostrar lo que valen los productos.
export default function OrderAmount() {

    const { getCalculatedCart } = useCart()
    const { subTotal, itemCount } = getCalculatedCart()

    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between items-center">
                <span>Items:</span>
                <span className="font-medium text-sm">{itemCount}</span>
            </div>

            <hr className="my-2 border-gray-200" />

            <div className="flex justify-between items-center font-bold text-lg">
                <span>Subtotal:</span>
                <span className="truncate max-w-[50%]">{formatCurrency(subTotal)}</span>
            </div>
        </div>
    );
}
