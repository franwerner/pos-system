"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import useGetPaymentMethods from "@/features/payment/hooks/useGetPaymentMethods.hook"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select"
import { Switch } from "@/shared/components/ui/switch"
import usePatchTax from "../hooks/usePatchTax.hook"
import usePostTax from "../hooks/usePostTax.hook"
import {
    TAX_TYPE_DESCRIPTIONS,
    TAX_TYPE_EXAMPLES,
    TAX_TYPE_LABELS,
    TAX_TYPES,
    usesAmount,
    usesPaymentMethod,
    usesRate,
    usesRecoverable,
    type Tax,
} from "../types/tax.type"

const taxFormSchema = z
    .object({
        name: z.string().trim().min(1, "El nombre es obligatorio").max(80, "El nombre es demasiado largo"),
        type: z.enum(TAX_TYPES),
        // Un input numérico vacío llega como NaN: el campo que el tipo elegido no
        // usa queda así y no tiene que trabar el formulario. Lo que hace falta de
        // verdad lo exige el refinamiento de abajo.
        rate: z.number().or(z.nan()).optional(),
        amount: z.number().or(z.nan()).optional(),
        is_recoverable: z.boolean(),
        payment_method_id: z.number().nullable(),
        is_active: z.boolean(),
    })
    .superRefine((values, ctx) => {
        if (usesRate(values.type)) {
            const rate = values.rate

            if (rate === undefined || Number.isNaN(rate) || rate < 0 || rate > 100) {
                ctx.addIssue({ code: "custom", path: ["rate"], message: "La tasa va de 0 a 100" })
            }
        }

        if (usesAmount(values.type) && !(Number(values.amount) > 0)) {
            ctx.addIssue({ code: "custom", path: ["amount"], message: "El monto debe ser mayor a 0" })
        }

        if (usesPaymentMethod(values.type) && values.payment_method_id === null) {
            ctx.addIssue({
                code: "custom",
                path: ["payment_method_id"],
                message: "Elegí el medio de pago",
            })
        }
    })

type TaxFormValues = z.infer<typeof taxFormSchema>

const parseNumericInput = (value: string, valueAsNumber: number) =>
    value === "" ? Number.NaN : valueAsNumber

const displayNumber = (value: number | undefined) =>
    value === undefined || Number.isNaN(value) ? "" : value

const toFormValues = (tax: Tax | null): TaxFormValues =>
    tax
        ? {
            name: tax.name,
            type: tax.type,
            rate: tax.rate,
            amount: tax.amount,
            is_recoverable: tax.is_recoverable,
            payment_method_id: tax.payment_method_id,
            is_active: tax.is_active,
        }
        : {
            name: "",
            type: "sale",
            rate: Number.NaN,
            amount: Number.NaN,
            is_recoverable: false,
            payment_method_id: null,
            is_active: true,
        }

interface TaxFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tax?: Tax | null
}

export default function TaxFormDialog({ open, onOpenChange, tax }: TaxFormDialogProps) {
    const { data: paymentMethods } = useGetPaymentMethods()
    const postTax = usePostTax()
    const patchTax = usePatchTax()

    const form = useForm<TaxFormValues>({
        resolver: zodResolver(taxFormSchema),
        defaultValues: toFormValues(null),
    })

    const type = form.watch("type")

    useEffect(() => {
        if (open) form.reset(toFormValues(tax ?? null))
    }, [open, tax])

    const onSubmit = (values: TaxFormValues) => {
        const input = {
            name: values.name,
            type: values.type,
            rate: Number.isFinite(values.rate) ? (values.rate as number) : 0,
            amount: Number.isFinite(values.amount) ? (values.amount as number) : 0,
            is_recoverable: values.is_recoverable,
            payment_method_id: values.payment_method_id,
            is_active: values.is_active,
        }

        const onSuccess = (message: string) => () => {
            toast.success(message)
            onOpenChange(false)
        }

        if (tax) {
            patchTax.mutate({ id: tax.id, ...input }, {
                onSuccess: onSuccess("Impuesto actualizado"),
                onError: (error) => toast.error(error.message),
            })
            return
        }

        postTax.mutate(input, {
            onSuccess: onSuccess("Impuesto cargado"),
            onError: (error) => toast.error(error.message),
        })
    }

    const isPending = postTax.isPending || patchTax.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{tax ? "Editar impuesto" : "Nuevo impuesto"}</DialogTitle>
                    <DialogDescription>
                        El tipo decide en qué paso del cálculo entra el impuesto y qué campos hacen
                        falta.
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
                                        <Input placeholder={TAX_TYPE_EXAMPLES[type]} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {TAX_TYPES.map((taxType) => (
                                                <SelectItem key={taxType} value={taxType}>
                                                    {TAX_TYPE_LABELS[taxType]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>{TAX_TYPE_DESCRIPTIONS[type]}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {usesRate(type) && (
                            <FormField
                                control={form.control}
                                name="rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tasa (%)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.0001"
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
                        )}

                        {usesAmount(type) && (
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monto mensual</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
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
                                            Se reparte entre las unidades vendidas del mes, como el
                                            alquiler.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {usesPaymentMethod(type) && (
                            <FormField
                                control={form.control}
                                name="payment_method_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Medio de pago</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(Number(value))}
                                            value={field.value === null ? "" : String(field.value)}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Elegí un medio de pago" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(paymentMethods ?? []).map((method) => (
                                                    <SelectItem key={method.id} value={String(method.id)}>
                                                        {method.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {usesRecoverable(type) && (
                            <FormField
                                control={form.control}
                                name="is_recoverable"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="pr-4">
                                            <FormLabel>Se recupera como crédito fiscal</FormLabel>
                                            <FormDescription>
                                                Si se recupera, se descuenta del precio de compra y no
                                                es costo. Si no, queda adentro del costo del insumo.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="pr-4">
                                        <FormLabel>Activo</FormLabel>
                                        <FormDescription>
                                            Un impuesto inactivo deja de entrar en el costeo.
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
                            <Button type="submit" disabled={isPending}>
                                {tax ? "Guardar cambios" : "Cargar impuesto"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
