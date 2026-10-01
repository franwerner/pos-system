"use client"

import { ArrowLeft, Clock, Info, Loader2, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useCart } from "@/features/cart/context/cart-context"
import { CajaAlert, CajaBadge, CajaHint } from "@/shared/components/caja-indicator.component"
import useGetOpenCashSession from "@/features/cash/hooks/useGetOpenCashSession.hook"
import CheckoutSuccess from "@/features/order/components/checkout-success.component"
import CloseModeSelector, { type CheckoutMode } from "@/features/order/components/close-mode-selector.component"
import OrderSummary from "@/features/order/components/order-summary.component"
import { usePostOrder } from "@/features/order/hooks/usePostOrder.hook"
import PaymentSplit from "@/features/payment/components/payment-split.component"
import { useGetPayments } from "@/features/payment/hooks/useGetPayments.hook"
import { usePaymentSplit } from "@/features/payment/hooks/usePaymentSplit.hook"
import { type PaymentDraft } from "@/features/payment/types/payment.type"
import CartStockWarning from "@/features/stock/components/cart-stock-warning.component"
import useGetCartShortages from "@/features/stock/hooks/useGetCartShortages.hook"
import Linker from "@/shared/components/linker.component"
import { EmptyState } from "@/shared/components/empty-state.component"
import { PosPageHeader } from "@/shared/components/pos-header.component"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import { Button } from "@/shared/components/ui/button"
import formatCurrency from "@/shared/utils/formatCurrency.util"

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
    const { breakdown, validPayments, coverageError } = usePaymentSplit(payments, paymentMethods ?? [], subTotal)

    // El primer pago arranca cubriendo todo con el método por defecto: el caso común
    // es un solo método, repartir es la excepción.
    useEffect(() => {
        if (payments.length > 0 || subTotal <= 0) return

        setPayments([{ payment_method_id: paymentMethod.id, amount: subTotal }])
    }, [subTotal, paymentMethod.id, payments.length])

    const isCashSessionOpen = !!cashSession
    const isPayBlocked = !isCashSessionOpen || !!coverageError

    const submitOrder = (status: CheckoutMode) => {
        createOrder({
            items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
            status: status === "pay" ? "paid" : "pending",
            payments: status === "pay" ? validPayments : [],
        }, {
            onSuccess: (order) => {
                clearCart()

                if (status === "pending") {
                    toast.success(`Pedido #${order.id} guardado como pendiente`, {
                        description: "Lo cobrás desde Pendientes cuando el cliente pague.",
                    })
                    router.push("/pos/orders")
                    return
                }

                router.push(`/pos/order/${order.id}`)
            },
            onError: (error) => toast.error("No se pudo completar el pago", {
                description: `${error.message} No se registró nada: el pedido sigue en el carrito.`,
            }),
        })
    }

    // Cobrado: pantalla de transición dedicada mientras redirige al ticket. El caso
    // "pendiente" no la necesita: ya vuelve a /pos/orders con su propio toast.
    if (isSuccess && mode === "pay") {
        return <CheckoutSuccess />
    }

    if (cart.length === 0) {
        return (
            <div className="flex h-dvh flex-col bg-background text-foreground">
                <PosPageHeader title="Cerrar el pedido" />
                <div className="flex flex-1 items-center justify-center">
                    <EmptyState
                        variant="plain"
                        size="lg"
                        icon={ShoppingCart}
                        title="Carrito vacío"
                        description="Agregá productos al carrito antes de cerrar el pedido."
                        action={
                            <Button asChild size="lg" className="mt-1 h-16 gap-2 rounded-xl px-8 text-xl font-extrabold">
                                <Linker href="/pos">
                                    <ArrowLeft className="size-6" aria-hidden />
                                    Volver al inicio
                                </Linker>
                            </Button>
                        }
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <PosPageHeader
                title="Cerrar el pedido"
                right={<CajaBadge open={isCashSessionOpen} initialAmount={cashSession?.opening_amount} />}
            />
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[420px_minmax(0,1fr)] lg:overflow-hidden">
                <div className="flex flex-col gap-4">
                    <OrderSummary />
                </div>

                <div className="flex min-h-0 flex-col gap-4 lg:overflow-y-auto">
                    <CloseModeSelector mode={mode} onChange={setMode} />

                    {mode === "pay"
                        ? (
                            <>
                                {!isCashSessionLoading && !isCashSessionOpen && (
                                    <CajaAlert onOpenCaja={() => router.push("/admin/cash")} />
                                )}

                                <CartStockWarning shortages={shortages ?? []} />

                                <PaymentSplit subTotal={subTotal} payments={payments} onChange={setPayments} />

                                <Button
                                    size="lg"
                                    className="h-16 w-full gap-2 rounded-xl text-xl font-extrabold"
                                    disabled={isPending || isCashSessionLoading || isPayBlocked}
                                    onClick={() => submitOrder("pay")}>
                                    {isPending && <Loader2 className="size-6 animate-spin" aria-hidden />}
                                    {isPending ? "Procesando pago..." : `Completar pago · ${formatCurrency(breakdown.total)}`}
                                </Button>
                                {!isCashSessionLoading && !isCashSessionOpen && <CajaHint />}
                            </>
                        )
                        : (
                            <>
                                <CartStockWarning shortages={shortages ?? []} />

                                <Alert className="flex items-start gap-3 border-transparent bg-muted p-[18px] text-foreground">
                                    <Info className="mt-0.5 size-5" aria-hidden />
                                    <div>
                                        <AlertTitle className="text-[15px] font-bold">Se prepara ahora, se cobra después</AlertTitle>
                                        <AlertDescription className="text-foreground">
                                            El pedido descuenta stock al tomarlo: la comida se prepara aunque todavía
                                            no se haya pagado. No hace falta caja abierta.
                                        </AlertDescription>
                                    </div>
                                </Alert>

                                <div className="flex-1" />

                                <Button
                                    size="lg"
                                    className="h-16 w-full gap-2 rounded-xl text-xl font-extrabold"
                                    disabled={isPending}
                                    onClick={() => submitOrder("pending")}>
                                    {isPending ? <Loader2 className="size-6 animate-spin" aria-hidden /> : <Clock className="size-6" aria-hidden />}
                                    {isPending ? "Guardando pedido..." : "Dejar pendiente"}
                                </Button>
                            </>
                        )}
                </div>
            </div>
        </div>
    )
}
