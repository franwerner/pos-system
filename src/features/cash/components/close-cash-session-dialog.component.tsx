"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, LockKeyhole } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/shared/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form"
import { Textarea } from "@/shared/components/ui/textarea"
import { DialogShell } from "@/shared/components/dialog-shell.component"
import useGetCashPaymentMethods from "../hooks/useGetCashPaymentMethods.hook"
import usePatchCashSession from "../hooks/usePatchCashSession.hook"
import { calculateCashCount } from "../services/calculateCashCount.service"
import { type CashSessionWithPayments } from "../types/cash-session.type"
import CashCountBreakdown from "./cash-count-breakdown.component"
import { CashDifferencePanel } from "./cash-difference-panel.component"
import { MoneyAmountInput } from "./money-amount-input.component"

const closeCashSessionSchema = z.object({
    counted_amount: z
        .number({ error: "Cargá lo que contaste. Si no hay nada en el cajón, poné 0." })
        .refine((value) => value >= 0, "Cargá lo que contaste. Si no hay nada en el cajón, poné 0."),
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

/**
 * Protagonista: la diferencia en vivo, mientras se escribe el contado real. Nunca bloquea el
 * cierre, por grande que sea (PLAN-UI/vistas/admin-cash.md): "Cerrar caja" siempre está habilitado.
 */
export default function CloseCashSessionDialog({ open, onOpenChange, session }: CloseCashSessionDialogProps) {
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

    const submitting = patchCashSession.isPending

    return (
        <DialogShell
            open={open}
            onOpenChange={onOpenChange}
            title="Cerrar caja"
            description="Contá la plata del cajón y compará con lo esperado. Solo el efectivo entra al arqueo."
            mobileBarTitle="Cerrar caja"
            widthClass="sm:max-w-[700px]"
            footer={
                <>
                    <Button type="button" variant="outline" className="hidden h-10 sm:inline-flex" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="close-cash-session-form" disabled={submitting} className="h-12 w-full gap-2 sm:h-10 sm:w-auto">
                        {submitting
                            ? (<><Loader2 className="size-4 animate-spin" aria-hidden /> Cerrando…</>)
                            : (<><LockKeyhole className="size-4" aria-hidden /> Cerrar caja</>)}
                    </Button>
                </>
            }
        >
            <Form {...form}>
                <form id="close-cash-session-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div className="grid items-start gap-4 sm:grid-cols-2 sm:gap-x-6">
                        <FormField
                            control={form.control}
                            name="counted_amount"
                            render={({ field, fieldState }) => (
                                <FormItem className="sm:col-start-2 sm:row-start-1">
                                    <FormLabel>Contado real</FormLabel>
                                    <FormControl>
                                        <MoneyAmountInput
                                            large
                                            autoFocus
                                            invalid={!!fieldState.error}
                                            name={field.name}
                                            ref={field.ref}
                                            onBlur={field.onBlur}
                                            value={displayNumber(field.value)}
                                            onChange={(event) => field.onChange(
                                                parseNumericInput(event.target.value, event.target.valueAsNumber),
                                            )}
                                        />
                                    </FormControl>
                                    {!fieldState.error && (
                                        <p className="text-muted-foreground text-sm">Solo el efectivo del cajón: billetes y monedas.</p>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="sm:col-start-2 sm:row-start-2">
                            <CashDifferencePanel
                                difference={count.difference}
                                counted={count.countedAmount}
                                expected={count.expectedAmount}
                            />
                        </div>

                        <div className="flex flex-col gap-2 sm:col-start-1 sm:row-span-3 sm:row-start-1">
                            <span className="hidden text-sm font-semibold sm:block">Desglose de esta caja</span>
                            <CashCountBreakdown count={count} />
                        </div>

                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem className="sm:col-start-2 sm:row-start-3">
                                    <FormLabel>Nota (opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea rows={2} placeholder="Ej.: faltó un vuelto del mediodía" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <p className="text-xs text-muted-foreground sm:text-sm">
                        La diferencia no frena el cierre: queda registrada tal cual.
                    </p>
                </form>
            </Form>
        </DialogShell>
    )
}
