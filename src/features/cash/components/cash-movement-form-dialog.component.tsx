"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/shared/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { DialogShell } from "@/shared/components/dialog-shell.component"
import { cn } from "@/shared/utils/cn.util"
import usePostCashMovement from "../hooks/usePostCashMovement.hook"
import { CASH_MOVEMENT_TYPES } from "../types/cash-movement.type"
import { MoneyAmountInput } from "./money-amount-input.component"

const cashMovementFormSchema = z.object({
    type: z.enum(CASH_MOVEMENT_TYPES),
    amount: z
        .number({ error: "El monto tiene que ser mayor a $0." })
        .refine((value) => value > 0, "El monto tiene que ser mayor a $0."),
    concept: z
        .string()
        .trim()
        .min(1, "El concepto es obligatorio.")
        .max(200, "El concepto es demasiado largo"),
})

type CashMovementFormValues = z.infer<typeof cashMovementFormSchema>

const emptyForm: CashMovementFormValues = {
    type: "deposit",
    amount: Number.NaN,
    concept: "",
}

// Un input numérico vacío no tiene número que reportar: NaN deja que el schema
// lo rechace en vez de que llegue un 0 que el usuario nunca escribió.
const parseNumericInput = (value: string, valueAsNumber: number) =>
    value === "" ? Number.NaN : valueAsNumber

const displayNumber = (value: number) => (Number.isNaN(value) ? "" : value)

const TYPE_OPTIONS = [
    { key: "deposit" as const, label: "Ingreso", icon: ArrowDownLeft },
    { key: "withdrawal" as const, label: "Egreso", icon: ArrowUpRight },
]

interface CashMovementFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sessionId: number | null
}

/** Ingreso o egreso de caja: plata que entra o sale del cajón sin ser una venta. */
export default function CashMovementFormDialog({ open, onOpenChange, sessionId }: CashMovementFormDialogProps) {
    const postCashMovement = usePostCashMovement()

    const form = useForm<CashMovementFormValues>({
        resolver: zodResolver(cashMovementFormSchema),
        defaultValues: emptyForm,
    })

    useEffect(() => {
        if (open) form.reset(emptyForm)
    }, [open])

    const type = form.watch("type")

    const onSubmit = (values: CashMovementFormValues) => {
        if (!sessionId) return

        postCashMovement.mutate({ ...values, cash_session_id: sessionId }, {
            onSuccess: () => {
                toast.success(values.type === "deposit" ? "Ingreso registrado" : "Egreso registrado")
                onOpenChange(false)
            },
        })
    }

    const submitting = postCashMovement.isPending

    return (
        <DialogShell
            open={open}
            onOpenChange={onOpenChange}
            title="Registrar ingreso o egreso"
            description="Plata que entra o sale del cajón sin ser una venta. Entra al arqueo con su signo."
            mobileBarTitle="Registrar ingreso o egreso"
            widthClass="sm:max-w-md"
            footer={
                <>
                    <Button type="button" variant="outline" className="hidden h-10 sm:inline-flex" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="cash-movement-form" disabled={submitting} className="h-12 w-full gap-2 sm:h-10 sm:w-auto">
                        {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
                        Registrar
                    </Button>
                </>
            }
        >
            <Form {...form}>
                <form id="cash-movement-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <Label id="cash-movement-type-label" className="text-sm font-semibold">Tipo</Label>
                                <div
                                    role="radiogroup"
                                    aria-labelledby="cash-movement-type-label"
                                    className="flex w-full gap-1 rounded-lg bg-muted p-1"
                                >
                                    {TYPE_OPTIONS.map(({ key, label, icon: Icon }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            role="radio"
                                            aria-checked={field.value === key}
                                            onClick={() => field.onChange(key)}
                                            className={cn(
                                                "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md text-[15px] font-semibold text-muted-foreground",
                                                field.value === key && "bg-card text-foreground shadow-sm",
                                            )}
                                        >
                                            <Icon className="size-4" aria-hidden /> {label}
                                        </button>
                                    ))}
                                </div>
                                <FormDescription>
                                    {type === "deposit"
                                        ? "Suma al esperado en caja: un aporte de cambio, una reposición."
                                        : "Resta del esperado en caja: un retiro, un flete, una compra en efectivo."}
                                </FormDescription>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormLabel>Monto</FormLabel>
                                <FormControl>
                                    <MoneyAmountInput
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
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="concept"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormLabel>Concepto</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Ej.: Compra de hielo"
                                        aria-invalid={fieldState.error ? true : undefined}
                                        className="h-11 sm:h-10"
                                        {...field}
                                    />
                                </FormControl>
                                {!fieldState.error && <FormDescription>Sin concepto el arqueo no se puede auditar.</FormDescription>}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </form>
            </Form>
        </DialogShell>
    )
}
