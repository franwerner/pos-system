"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select"
import { cn } from "@/shared/utils/cn.util"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import { useGetPayments } from "../hooks/useGetPayments.hook"
import { calculateTax } from "../services/calculateTax.service"
import { adjustmentLabel, formatAdjustmentPercentage } from "../services/describeAdjustment.service"
import { type PaymentDraft } from "../types/payment.type"
import { usePaymentSplit } from "../hooks/usePaymentSplit.hook"

interface PaymentSplitProps {
    subTotal: number
    payments: PaymentDraft[]
    onChange: (payments: PaymentDraft[]) => void
}

// Un input numérico vacío no tiene número que reportar: NaN deja la parte sin monto
// en vez de escribir un 0 que el usuario nunca puso.
const displayAmount = (amount: number) => (Number.isNaN(amount) ? "" : amount)

export default function PaymentSplit({ subTotal, payments, onChange }: PaymentSplitProps) {
    const { data: paymentMethods } = useGetPayments()
    const methods = paymentMethods ?? []

    const { breakdown, coverageError } = usePaymentSplit(payments, methods, subTotal)

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
            <div className="flex flex-col gap-3">
                {payments.map((payment, index) => {
                    const method = methods.find((item) => item.id === payment.payment_method_id)
                    const amount = Number.isFinite(payment.amount) ? payment.amount : 0
                    const adjustment = method ? calculateTax(amount, method.tax).tax : 0

                    return (
                        <div key={index} className="flex flex-col gap-2 rounded-xl border p-3">
                            <div className="flex items-end gap-2">
                                <div className="flex flex-1 flex-col gap-1">
                                    <Label htmlFor={`payment-method-${index}`}>Método</Label>
                                    <Select
                                        value={payment.payment_method_id.toString()}
                                        onValueChange={(value) => updatePayment(index, {
                                            payment_method_id: Number(value),
                                        })}>
                                        <SelectTrigger id={`payment-method-${index}`} className="w-full">
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
                                </div>

                                <div className="flex w-36 flex-col gap-1">
                                    <Label htmlFor={`payment-amount-${index}`}>Monto</Label>
                                    <Input
                                        id={`payment-amount-${index}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={displayAmount(payment.amount)}
                                        onChange={(event) => updatePayment(index, {
                                            amount: event.target.value === ""
                                                ? Number.NaN
                                                : event.target.valueAsNumber,
                                        })}
                                    />
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Quitar pago"
                                    disabled={payments.length === 1}
                                    onClick={() => onChange(payments.filter((_, current) => current !== index))}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                {adjustment === 0
                                    ? "Esta parte se cobra al precio de lista"
                                    : `${adjustmentLabel(adjustment)} de esta parte: ${formatCurrency(Math.abs(adjustment))}`}
                            </p>
                        </div>
                    )
                })}
            </div>

            <Button type="button" variant="outline" onClick={addPayment} disabled={methods.length === 0}>
                <Plus className="h-4 w-4" />
                Agregar otro método
            </Button>

            <div className="flex flex-col gap-1 rounded-xl border bg-muted/40 p-3 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                        {adjustmentLabel(breakdown.surchargeTotal, true)}
                    </span>
                    <span>{formatCurrency(breakdown.surchargeTotal)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2 font-semibold">
                    <span>Total a cobrar</span>
                    <span>{formatCurrency(breakdown.total)}</span>
                </div>
                <div className={cn(
                    "flex items-center justify-between",
                    coverageError ? "text-destructive" : "text-muted-foreground",
                )}>
                    <span>Falta asignar</span>
                    <span>{formatCurrency(breakdown.remaining)}</span>
                </div>
            </div>

            {coverageError && <p className="text-sm text-destructive">{coverageError}</p>}
        </div>
    )
}
