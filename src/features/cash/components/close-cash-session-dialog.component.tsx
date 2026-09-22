"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/shared/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/shared/components/ui/form"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import useGetCashPaymentMethods from "../hooks/useGetCashPaymentMethods.hook"
import usePatchCashSession from "../hooks/usePatchCashSession.hook"
import { calculateCashCount } from "../services/calculateCashCount.service"
import { type CashSessionWithPayments } from "../types/cash-session.type"
import CashCountBreakdown from "./cash-count-breakdown.component"
import CashCountDifference from "./cash-count-difference.component"

const closeCashSessionSchema = z.object({
    counted_amount: z
        .number({ error: "El monto contado debe ser 0 o mayor" })
        .refine((value) => value >= 0, "El monto contado debe ser 0 o mayor"),
    note: z.string().trim().max(500, "La nota es demasiado larga"),
})

type CloseCashSessionFormValues = z.infer<typeof closeCashSessionSchema>

const emptyForm = (): CloseCashSessionFormValues => ({
    counted_amount: Number.NaN,
    note: "",
})

// Un input numérico vacío no tiene número que reportar: NaN deja que el schema
// lo rechace en vez de que llegue un 0 que el usuario nunca escribió.
const parseNumericInput = (value: string, valueAsNumber: number) =>
    value === "" ? Number.NaN : valueAsNumber

const displayNumber = (value: number) => (Number.isNaN(value) ? "" : value)

interface CloseCashSessionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    session: CashSessionWithPayments | null
}

export default function CloseCashSessionDialog({
    open,
    onOpenChange,
    session,
}: CloseCashSessionDialogProps) {
    const patchCashSession = usePatchCashSession()
    const { paymentMethods, cashPaymentMethodIds } = useGetCashPaymentMethods()

    const form = useForm<CloseCashSessionFormValues>({
        resolver: zodResolver(closeCashSessionSchema),
        defaultValues: emptyForm(),
    })

    useEffect(() => {
        if (open) form.reset(emptyForm())
    }, [open])

    const countedAmount = form.watch("counted_amount")

    if (!session) return null

    const count = calculateCashCount({
        openingAmount: session.opening_amount,
        sales: session.payments,
        movements: session.movements,
        paymentMethods,
        cashPaymentMethodIds,
        countedAmount: Number.isNaN(countedAmount) ? null : countedAmount,
    })

    const onSubmit = (values: CloseCashSessionFormValues) => {
        patchCashSession.mutate({
            id: session.id,
            counted_amount: values.counted_amount,
            note: values.note || null,
        }, {
            onSuccess: () => {
                toast.success("Caja cerrada: el arqueo quedó registrado")
                onOpenChange(false)
            },
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Cerrar caja</DialogTitle>
                    <DialogDescription>
                        Contá la plata del cajón y compará con lo esperado. Solo el efectivo entra al arqueo.
                    </DialogDescription>
                </DialogHeader>

                <CashCountBreakdown count={count} />

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="counted_amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contado real</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            autoFocus
                                            name={field.name}
                                            ref={field.ref}
                                            onBlur={field.onBlur}
                                            value={displayNumber(field.value)}
                                            onChange={(event) => field.onChange(
                                                parseNumericInput(event.target.value, event.target.valueAsNumber),
                                            )}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {count.difference !== null && (
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <span className="text-sm text-muted-foreground">Diferencia</span>
                                <CashCountDifference difference={count.difference} className="text-lg font-semibold" />
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nota (opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea rows={2} placeholder="Faltó un vuelto" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={patchCashSession.isPending}>
                                Cerrar caja
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
