"use client"

import EmptyCart from "@/features/cart/components/empty-cart.component"
import { useCart } from "@/features/cart/context/cart-context"
import Linker from "@/shared/components/linker.component"
import { Button } from "@/shared/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import OrderSummary from "../features/order/components/order-summary.component"
import PaymentMethods from "../features/payment/components/payment-methods.component"

const EmptyCartContainer = () => {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <EmptyCart
                content={<Button size="lg" className="py-8" asChild>
                    <Link href="/pos">
                        <ArrowLeft className="h-4 w-4" />
                        Volver al inicio
                    </Link>
                </Button>}
            />
        </div>
    )
}

export default function CheckoutView() {
    const { cart } = useCart()

    const isEmptyCart = cart.length === 0

    if (isEmptyCart) {
        return <EmptyCartContainer />
    }
    return (
        <div className="container mx-auto p-4 max-w-5xl py-10">
            <Button asChild variant="ghost" className="mb-6">
                <Linker href="/pos">
                    <div className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Volver al inicio
                    </div>
                </Linker>
            </Button>

            <h1 className="mb-8 text-3xl font-bold text-gray-900">Checkout</h1>

            <div className="grid gap-8  md:grid-cols-2">
                <div className="rounded-xl border p-6 bg-white shadow-sm">
                    <OrderSummary />
                </div>

                <div className="rounded-xl border p-6 bg-white shadow-sm ">
                    <div className="sticky top-32">
                        <h2 className="mb-4 text-xl font-semibold text-gray-800">Método de pago</h2>
                        <PaymentMethods />
                        <Button asChild size="lg" className="mt-6 py-8 w-full">
                            <Linker href="checkout/success">Completar pago</Linker>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}