"use client"

import { CircleCheck, Plus, Trash2, TriangleAlert } from "lucide-react"
import { Alert, AlertTitle } from "@/shared/components/ui/alert"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select"
import { Separator } from "@/shared/components/ui/separator"
import { Money } from "@/shared/components/money.component"
import { cn } from "@/shared/utils/cn.util"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import { useGetPayments } from "../hooks/useGetPayments.hook"
import { usePaymentSplit } from "../hooks/usePaymentSplit.hook"
import { calculateTax } from "../services/calculateTax.service"
import { adjustmentLabel, formatAdjustmentPercentage } from "../services/describeAdjustment.service"
import { type PaymentDraft } from "../types/payment.type"

interface PaymentSplitProps {
    subTotal: number
    payments: PaymentDraft[]
    onChange: (payments: PaymentDraft[]) => void
    /** Tamaño táctil (POS, default). false = tamaño compacto para diálogos de admin. */
    touch?: boolean
}

// Un input numérico vacío no tiene número que reportar: NaN deja la parte sin monto
// en vez de escribir un 0 que el usuario nunca puso.
const displayAmount = (amount: number) => (Number.isNaN(amount) ? "" : amount)

export default function PaymentSplit({ subTotal, payments, onChange, touch = true }: PaymentSplitProps) {
    const { data: paymentMethods } = useGetPayments()
    const methods = paymentMethods ?? []

    const { breakdown, coverageError } = usePaymentSplit(payments, methods, subTotal)
    const closes = coverageError === null
    const h = touch ? "h-[52px] text-[17px]" : "h-10"

    const updatePayment = (index: number, values: Partial<PaymentDraft>) => {
        onChange(payments.map((payment, current) => (
            current === index ? { ...payment, ...values } : payment
        )))
    }

    const addPayment = () => {
        const firstMethodId = methods[0]?.id

        if (firstMethodId === undefined) return

        onChange([
            ...payments,
            {
                payment_method_id: firstMethodId,
                amount: breakdown.remaining > 0 ? breakdown.remaining : Number.NaN,
            },
        ])
    }

    return (
        <div className="flex flex-col gap-4">
            <Card className="gap-3.5 p-[18px]">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Repartir pago</h3>
                    <span className="text-sm text-muted-foreground">Podés dividirlo entre varios medios</span>
                </div>

                {payments.map((payment, index) => {
                    const method = methods.find((item) => item.id === payment.payment_method_id)
                    const amount = Number.isFinite(payment.amount) ? payment.amount : 0
                    const adjustment = method ? calculateTax(amount, method.tax).tax : 0

                    return (
                        <div key={index} className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2.5">
                                <Select
                                    value={payment.payment_method_id.toString()}
                                    onValueChange={(value) => updatePayment(index, {
                                        payment_method_id: Number(value),
                                    })}>
                                    <SelectTrigger className={cn("flex-1 font-semibold", h)} aria-label={`Medio de pago ${index + 1}`}>
                                        <SelectValue placeholder="Elegí un método" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {methods.map((item) => (
                                            <SelectItem key={item.id} value={item.id.toString()}>
                                                {item.name}
                                                {item.tax !== 0
                                                    && ` (${formatAdjustmentPercentage(item.tax)})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="relative w-[190px]">
                                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">
                                        $
                                    </span>
                                    <Input
                                        aria-label={`Monto ${index + 1}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={displayAmount(payment.amount)}
                                        onChange={(event) => updatePayment(index, {
                                            amount: event.target.value === ""
                                                ? Number.NaN
                                                : event.target.valueAsNumber,
                                        })}
                                        className={cn("pl-7 font-bold tabular-nums", h)}
                                    />
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className={touch ? "size-[52px]" : "size-10"}
                                    aria-label="Quitar este pago"
                                    disabled={payments.length === 1}
                                    onClick={() => onChange(payments.filter((_, current) => current !== index))}>
                                    <Trash2 className="size-5" aria-hidden />
                                </Button>
                            </div>

                            <span className="pl-1 text-sm text-muted-foreground">
                                {adjustment === 0
                                    ? "Esta parte se cobra al precio de lista"
                                    : `${adjustmentLabel(adjustment)} de esta parte: ${formatCurrency(Math.abs(adjustment))}`}
                            </span>
                        </div>
                    )
                })}

                <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className={cn("self-start gap-2", touch && "h-12")}
                    onClick={addPayment}
                    disabled={methods.length === 0}>
                    <Plus className="size-5" aria-hidden />
                    Agregar otro método
                </Button>

                <Separator />

                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <Money value={subTotal} size="sm" tone="muted" className="text-base" />
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>{adjustmentLabel(breakdown.surchargeTotal, true)}</span>
                        <Money value={breakdown.surchargeTotal} size="sm" tone="muted" className="text-base" />
                    </div>
                    <div className="flex items-baseline justify-between">
                        <span className="text-lg font-bold">Total a cobrar</span>
                        <Money value={breakdown.total} size="hero" />
                    </div>
                    <div className={cn(
                        "flex items-center justify-between",
                        closes ? "text-success-muted-foreground" : "text-negative",
                    )}>
                        <span className="flex items-center gap-1.5 font-bold">
                            {closes ? <CircleCheck className="size-4" aria-hidden /> : <TriangleAlert className="size-4" aria-hidden />}
                            {breakdown.remaining < 0 ? "Sobra" : "Falta asignar"}
                        </span>
                        <Money value={Math.abs(breakdown.remaining)} className="font-bold" />
                    </div>
                </div>
            </Card>

            {coverageError && (
                <Alert className="flex items-center gap-2.5 border-transparent bg-destructive-muted text-destructive-muted-foreground" role="alert">
                    <TriangleAlert className="size-5" aria-hidden />
                    <AlertTitle className="font-bold">{coverageError}</AlertTitle>
                </Alert>
            )}
        </div>
    )
}
