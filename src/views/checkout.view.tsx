"use client"

import EmptyCart from "@/features/cart/components/empty-cart.component"
import { useCart } from "@/features/cart/context/cart-context"
import CashSessionAlert from "@/features/cash/components/cash-session-alert.component"
import useGetOpenCashSession from "@/features/cash/hooks/useGetOpenCashSession.hook"
import OrderSummary from "@/features/order/components/order-summary.component"
import { usePostOrder } from "@/features/order/hooks/usePostOrder.hook"
import PaymentSplit from "@/features/payment/components/payment-split.component"
import { useGetPayments } from "@/features/payment/hooks/useGetPayments.hook"
import { usePaymentSplit } from "@/features/payment/hooks/usePaymentSplit.hook"
import { type PaymentDraft } from "@/features/payment/types/payment.type"
import CartStockWarning from "@/features/stock/components/cart-stock-warning.component"
import useGetCartShortages from "@/features/stock/hooks/useGetCartShortages.hook"
import Linker from "@/shared/components/linker.component"
import { Loader } from "@/shared/components/loader.component"
import { Button } from "@/shared/components/ui/button"
import { Label } from "@/shared/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group"
import { cn } from "@/shared/utils/cn.util"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

type CheckoutMode = "pay" | "pending"

const EmptyCartContainer = () => {
    return (
        <div className="flex h-screen items-center w-full justify-center bg-gray-50">
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
    const { cart, clearCart, paymentMethod, getCalculatedCart } = useCart()
    const router = useRouter()
    const { mutate: createOrder, isPending, isSuccess } = usePostOrder()
    const { data: shortages } = useGetCartShortages(
        cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
    )
    const { data: cashSession, isLoading: isCashSessionLoading } = useGetOpenCashSession()
    const { data: paymentMethods } = useGetPayments()

    const [mode, setMode] = useState<CheckoutMode>("pay")
    const [payments, setPayments] = useState<PaymentDraft[]>([])

    const { subTotal } = getCalculatedCart()
    const { validPayments, coverageError } = usePaymentSplit(payments, paymentMethods ?? [], subTotal)

    // El primer pago arranca cubriendo todo con el método por defecto: el caso común
    // es un solo método, repartir es la excepción.
    useEffect(() => {
        if (payments.length > 0 || subTotal <= 0) return

        setPayments([{ payment_method_id: paymentMethod.id, amount: subTotal }])
    }, [subTotal, paymentMethod.id, payments.length])

    const isCashSessionOpen = !!cashSession

    const submitOrder = (status: CheckoutMode) => {
        createOrder({
            items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
            status: status === "pay" ? "paid" : "pending",
            payments: status === "pay" ? validPayments : [],
        }, {
            onSuccess: (order) => {
                clearCart()

                if (status === "pending") {
                    toast.success(`Pedido #${order.id} tomado: queda pendiente de cobro`)
                    router.push("/pos/orders")
                    return
                }

                router.push(`/pos/order/${order.id}`)
            },
            onError: (error) => toast.error(error.message),
        })
    }

    if (isSuccess) {
        return <Loader className="h-screen" />
    }

    if (cart.length === 0) {
        return <EmptyCartContainer />
    }

    const isPayBlocked = !isCashSessionOpen || !!coverageError

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

            {!isCashSessionLoading && !isCashSessionOpen && <CashSessionAlert />}

            <CartStockWarning shortages={shortages ?? []} />

            <div className="grid gap-8 md:grid-cols-2">
                <div className="rounded-xl border p-6 bg-white shadow-sm">
                    <OrderSummary />
                </div>

                <div className="rounded-xl border p-6 bg-white shadow-sm">
                    <div className="flex flex-col gap-6">
                        <div>
                            <h2 className="mb-3 text-xl font-semibold text-gray-800">¿Cómo cerrás el pedido?</h2>
                            <RadioGroup
                                value={mode}
                                onValueChange={(value) => setMode(value as CheckoutMode)}
                                className="grid gap-3 sm:grid-cols-2">
                                {([
                                    { value: "pay", label: "Cobrar ahora", hint: "Se registra el pago y queda cobrado." },
                                    { value: "pending", label: "Dejar pendiente", hint: "Se prepara igual y se cobra después." },
                                ] as const).map((option) => (
                                    <div
                                        key={option.value}
                                        onClick={() => setMode(option.value)}
                                        className={cn(
                                            "flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition",
                                            mode === option.value
                                                ? "border-primary bg-primary/5"
                                                : "border-gray-200 hover:border-gray-300",
                                        )}>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value={option.value} id={`mode-${option.value}`} />
                                            <Label htmlFor={`mode-${option.value}`} className="cursor-pointer font-medium">
                                                {option.label}
                                            </Label>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{option.hint}</p>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        {mode === "pay"
                            ? (
                                <>
                                    <PaymentSplit
                                        subTotal={subTotal}
                                        payments={payments}
                                        onChange={setPayments}
                                    />
                                    <Button
                                        size="lg"
                                        className="py-8 w-full"
                                        disabled={isPending || isCashSessionLoading || isPayBlocked}
                                        onClick={() => submitOrder("pay")}>
                                        {isPending ? "Procesando pago..." : "Completar pago"}
                                    </Button>
                                    {!isCashSessionLoading && !isCashSessionOpen && (
                                        <p className="text-center text-sm text-destructive">
                                            Abrí la caja para poder cobrar.
                                        </p>
                                    )}
                                </>
                            )
                            : (
                                <>
                                    <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                                        El pedido descuenta stock al tomarlo: la comida se prepara aunque todavía
                                        no se haya pagado. No hace falta caja abierta.
                                    </p>
                                    <Button
                                        size="lg"
                                        className="py-8 w-full"
                                        disabled={isPending}
                                        onClick={() => submitOrder("pending")}>
                                        {isPending ? "Guardando pedido..." : "Dejar pendiente"}
                                    </Button>
                                </>
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
}
