"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/shared/components/ui/form"
import { Input } from "@/shared/components/ui/input"
import { Switch } from "@/shared/components/ui/switch"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import usePatchPaymentMethod from "../hooks/usePatchPaymentMethod.hook"
import usePostPaymentMethod from "../hooks/usePostPaymentMethod.hook"
import { calculateTax } from "../services/calculateTax.service"
import { type Payment } from "../types/payment.type"
import { AdjustmentBadge } from "./adjustment-badge.component"

const paymentMethodFormSchema = z.object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(60, "El nombre es demasiado largo"),
    tax: z
        .number({ error: "El ajuste es obligatorio" })
        .refine((value) => value > -100 && value <= 100, "Tiene que estar entre -99,99 y 100."),
    is_active: z.boolean(),
})

type PaymentMethodFormValues = z.infer<typeof paymentMethodFormSchema>

/** Monto base del ejemplo en vivo: "Un pedido de $10.000 se cobra $X" (Design/export). */
const EXAMPLE_BASE_AMOUNT = 10000

const parseNumericInput = (value: string, valueAsNumber: number) =>
    value === "" ? Number.NaN : valueAsNumber

const displayNumber = (value: number) => (Number.isNaN(value) ? "" : value)

const toFormValues = (paymentMethod: Payment | null): PaymentMethodFormValues =>
    paymentMethod
        ? { name: paymentMethod.name, tax: paymentMethod.tax, is_active: paymentMethod.is_active }
        : { name: "", tax: Number.NaN, is_active: true }

interface PaymentMethodFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    paymentMethod?: Payment | null
}

export default function PaymentMethodFormDialog({
    open,
    onOpenChange,
    paymentMethod,
}: PaymentMethodFormDialogProps) {
    const postPaymentMethod = usePostPaymentMethod()
    const patchPaymentMethod = usePatchPaymentMethod()

    const form = useForm<PaymentMethodFormValues>({
        resolver: zodResolver(paymentMethodFormSchema),
        defaultValues: toFormValues(null),
    })

    useEffect(() => {
        if (open) form.reset(toFormValues(paymentMethod ?? null))
    }, [open, paymentMethod])

    const onSubmit = (values: PaymentMethodFormValues) => {
        if (paymentMethod) {
            patchPaymentMethod.mutate({ id: paymentMethod.id, ...values }, {
                onSuccess: () => {
                    toast.success("Tarifa actualizada")
                    onOpenChange(false)
                },
                onError: (error) => toast.error(error.message),
            })
            return
        }

        postPaymentMethod.mutate(values, {
            onSuccess: () => {
                toast.success("Tarifa cargada")
                onOpenChange(false)
            },
            onError: (error) => toast.error(error.message),
        })
    }

    const isPending = postPaymentMethod.isPending || patchPaymentMethod.isPending

    // Ejemplo en vivo (Design/export/15-admin-payment-methods): se oculta mientras el
    // campo esté vacío o inválido, nunca con un número a medio escribir y sin sentido.
    const watchedTax = form.watch("tax")
    const example =
        !Number.isNaN(watchedTax) && !form.formState.errors.tax
            ? calculateTax(EXAMPLE_BASE_AMOUNT, watchedTax)
            : null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{paymentMethod ? "Editar tarifa" : "Nueva tarifa"}</DialogTitle>
                    <DialogDescription>
                        Si le cobrás más (o le hacés descuento) al cliente por pagar con este medio.
                        Dejalo en 0 si no cambia nada.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej.: Tarjeta de crédito" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="tax"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Recargo o descuento al cliente (%)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="-99.99"
                                            max="100"
                                            step="0.01"
                                            placeholder="0"
                                            className="tabular-nums"
                                            name={field.name}
                                            ref={field.ref}
                                            onBlur={field.onBlur}
                                            value={displayNumber(field.value)}
                                            onChange={(event) => field.onChange(
                                                parseNumericInput(event.target.value, event.target.valueAsNumber),
                                            )}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Negativo es descuento (-10 = 10% menos), positivo es recargo
                                        (10 = 10% más) y 0 cobra el precio de lista.
                                    </FormDescription>
                                    {example && (
                                        <div className="flex flex-wrap items-center gap-2.5 rounded-md bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                                            <AdjustmentBadge tax={watchedTax} />
                                            <span>
                                                Un pedido de {formatCurrency(EXAMPLE_BASE_AMOUNT)} se cobra{" "}
                                                <b className="tabular-nums text-foreground">
                                                    {formatCurrency(example.total)}
                                                </b>
                                                .
                                            </span>
                                        </div>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between gap-4 rounded-xl border border-border px-3.5 py-3">
                                    <div className="flex flex-col gap-0.5">
                                        <FormLabel>Activo</FormLabel>
                                        <FormDescription>
                                            Una tarifa inactiva deja de aparecer en el cobro.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending} className="gap-2">
                                {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                                {isPending
                                    ? "Guardando…"
                                    : paymentMethod ? "Guardar cambios" : "Crear tarifa"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
