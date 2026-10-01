"use client"

import { Loader2, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import useGetOpenCashSession from "@/features/cash/hooks/useGetOpenCashSession.hook"
import PaymentSplit from "@/features/payment/components/payment-split.component"
import { useGetPayments } from "@/features/payment/hooks/useGetPayments.hook"
import { usePaymentSplit } from "@/features/payment/hooks/usePaymentSplit.hook"
import { type PaymentDraft } from "@/features/payment/types/payment.type"
import { CajaAlert } from "@/shared/components/caja-indicator.component"
import { Money } from "@/shared/components/money.component"
import { Button } from "@/shared/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/components/ui/dialog"
import usePayOrder from "../hooks/usePayOrder.hook"
import { type Order } from "../types/sale.type"

interface PayOrderDialogProps {
    order: Order | null
    onOpenChange: (open: boolean) => void
    onPaid?: (order: Order) => void
}

const formatTime = (value: string) =>
    new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value))

const describeProducts = (order: Order) =>
    order.items.map((item) => `${item.product.name} × ${item.quantity}`).join(", ")

export default function PayOrderDialog({ order, onOpenChange, onPaid }: PayOrderDialogProps) {
    const router = useRouter()
    const payOrder = usePayOrder()
    const { data: paymentMethods } = useGetPayments()
    const { data: cashSession, isLoading: isCashSessionLoading } = useGetOpenCashSession()

    const [payments, setPayments] = useState<PaymentDraft[]>([])

    const subTotal = order?.sub_total ?? 0
    const { validPayments, coverageError } = usePaymentSplit(payments, paymentMethods ?? [], subTotal)

    const firstMethodId = paymentMethods?.[0]?.id

    useEffect(() => {
        if (!order || firstMethodId === undefined) return

        setPayments([{ payment_method_id: firstMethodId, amount: order.sub_total }])
    }, [order?.id, firstMethodId])

    if (!order) return null

    const confirmPayment = () => {
        payOrder.mutate({ id: order.id, payments: validPayments }, {
            onSuccess: (paid) => {
                toast.success(`Pedido #${paid.id} cobrado`)
                onOpenChange(false)
                onPaid?.(paid)
            },
            onError: (error) => toast.error(error.message),
        })
    }

    return (
        <Dialog open onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[calc(100dvh-48px)] w-full max-w-[760px] flex-col gap-0 overflow-hidden rounded-[18px] p-0 sm:max-w-[760px]">
                <DialogHeader className="gap-1 px-6 pr-16 pt-[22px] text-left">
                    <DialogTitle className="text-2xl font-extrabold">Cobrar pedido #{order.id}</DialogTitle>
                    <DialogDescription className="text-[15px]">
                        Repartí el total entre los métodos que use el cliente. El descuento o recargo de
                        cada método se calcula sobre su propia parte.
                    </DialogDescription>
                </DialogHeader>

                <fieldset
                    disabled={payOrder.isPending}
                    className="m-0 flex min-w-0 flex-col gap-4 overflow-y-auto border-0 px-6 py-5">
                    {!isCashSessionLoading && !cashSession && (
                        <CajaAlert onOpenCaja={() => router.push("/admin/cash")} />
                    )}

                    <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
                        <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="text-sm font-semibold">
                                Tomado {formatTime(order.created_at)} · {describeProducts(order)}
                            </span>
                            <span className="text-[13px] text-muted-foreground">
                                Subtotal congelado al tomar el pedido
                            </span>
                        </div>
                        <Money value={order.sub_total} className="ml-4 text-[22px]" />
                    </div>

                    <PaymentSplit subTotal={subTotal} payments={payments} onChange={setPayments} touch />
                </fieldset>

                <DialogFooter className="gap-2.5 border-t border-border px-6 py-4">
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="h-[52px] px-[22px] text-[17px]"
                        disabled={payOrder.isPending}
                        onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        size="lg"
                        className="h-[52px] min-w-[200px] gap-2 px-[22px] text-[17px]"
                        onClick={confirmPayment}
                        disabled={payOrder.isPending || !!coverageError || !cashSession}>
                        {payOrder.isPending ? (
                            <>
                                <Loader2 className="size-6 animate-spin" aria-hidden />
                                Procesando pago...
                            </>
                        ) : (
                            <>
                                <Wallet className="size-5" aria-hidden />
                                Cobrar
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
