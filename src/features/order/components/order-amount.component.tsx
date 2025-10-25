"use client"

import { useCart } from "@/features/cart/context/cart-context";
import formatCurrency from "@/shared/utils/formatCurrency.util";

export default function OrderAmount() {

    const { getCalculatedCart, paymentMethod } = useCart()
    const { subTotal, taxAmount, total } = getCalculatedCart()
    const { name, tax } = paymentMethod

    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between items-center">
                <span>Método de pago:</span>
                <span className="font-semibold truncate max-w-[50%] text-[15px]">{name}</span>
            </div>

            <div className="flex justify-between items-center">
                <span>Subtotal:</span>
                <span className="font-medium truncate max-w-[50%] text-sm">{formatCurrency(subTotal)}</span>
            </div>

            <div className="flex justify-between items-center ">
                <span>Tarifa ({tax}%):</span>
                <span className="font-medium truncate max-w-[50%] text-sm">{formatCurrency(taxAmount)}</span>
            </div>

            <hr className="my-2 border-gray-200" />

            <div className="flex justify-between items-center font-bold text-lg">
                <span>Total:</span>
                <span className="truncate max-w-[50%]">{formatCurrency(total)}</span>
            </div>
        </div>
    );
}