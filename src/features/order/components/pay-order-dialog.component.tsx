"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import CashSessionAlert from "@/features/cash/components/cash-session-alert.component"
import useGetOpenCashSession from "@/features/cash/hooks/useGetOpenCashSession.hook"
import PaymentSplit from "@/features/payment/components/payment-split.component"
import { useGetPayments } from "@/features/payment/hooks/useGetPayments.hook"
import { usePaymentSplit } from "@/features/payment/hooks/usePaymentSplit.hook"
import { type PaymentDraft } from "@/features/payment/types/payment.type"
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

export default function PayOrderDialog({ order, onOpenChange, onPaid }: PayOrderDialogProps) {
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
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Cobrar pedido #{order.id}</DialogTitle>
                    <DialogDescription>
                        Repartí el total entre los métodos que use el cliente. El descuento o recargo de
                        cada método se calcula sobre su propia parte.
                    </DialogDescription>
                </DialogHeader>

                {!isCashSessionLoading && !cashSession && <CashSessionAlert />}

                <PaymentSplit subTotal={subTotal} payments={payments} onChange={setPayments} />

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={confirmPayment}
                        disabled={payOrder.isPending || !!coverageError || !cashSession}>
                        Cobrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
