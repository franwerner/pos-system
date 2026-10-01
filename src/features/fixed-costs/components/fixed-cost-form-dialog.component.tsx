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
import usePatchFixedCost from "../hooks/usePatchFixedCost.hook"
import usePostFixedCost from "../hooks/usePostFixedCost.hook"
import { toMonthValue, toPeriodDate } from "../services/resolvePeriod.service"
import { type FixedCost } from "../types/fixed-cost.type"

const fixedCostFormSchema = z.object({
    concept: z.string().trim().min(1, "El concepto es obligatorio").max(120, "El concepto es demasiado largo"),
    amount: z
        .number({ error: "El monto debe ser 0 o mayor" })
        .refine((value) => value >= 0, "El monto debe ser 0 o mayor"),
    month: z.string().regex(/^\d{4}-\d{2}$/, "Elegí un mes"),
})

type FixedCostFormValues = z.infer<typeof fixedCostFormSchema>

// Un input numérico vacío no tiene número que reportar: NaN deja que el schema
// lo rechace en vez de que llegue un 0 que el usuario nunca escribió.
const parseNumericInput = (value: string, valueAsNumber: number) =>
    value === "" ? Number.NaN : valueAsNumber

const displayNumber = (value: number) => (Number.isNaN(value) ? "" : value)

const toFormValues = (fixedCost: FixedCost | null, month: string): FixedCostFormValues =>
    fixedCost
        ? {
            concept: fixedCost.concept,
            amount: fixedCost.amount,
            month: toMonthValue(fixedCost.period),
        }
        : { concept: "", amount: Number.NaN, month }

interface FixedCostFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    fixedCost?: FixedCost | null
    defaultMonth: string
}

export default function FixedCostFormDialog({
    open,
    onOpenChange,
    fixedCost,
    defaultMonth,
}: FixedCostFormDialogProps) {
    const postFixedCost = usePostFixedCost()
    const patchFixedCost = usePatchFixedCost()

    const form = useForm<FixedCostFormValues>({
        resolver: zodResolver(fixedCostFormSchema),
        defaultValues: toFormValues(null, defaultMonth),
    })

    useEffect(() => {
        if (open) form.reset(toFormValues(fixedCost ?? null, defaultMonth))
    }, [open, fixedCost, defaultMonth])

    const onSubmit = (values: FixedCostFormValues) => {
        const input = {
            concept: values.concept,
            amount: values.amount,
            period: toPeriodDate(values.month),
        }

        if (fixedCost) {
            patchFixedCost.mutate({ id: fixedCost.id, values: input }, {
                onSuccess: () => {
                    toast.success("Costo fijo actualizado")
                    onOpenChange(false)
                },
                onError: (error) => toast.error(error.message),
            })
            return
        }

        postFixedCost.mutate(input, {
            onSuccess: () => {
                toast.success("Costo fijo cargado")
                onOpenChange(false)
            },
            onError: (error) => toast.error(error.message),
        })
    }

    const isPending = postFixedCost.isPending || patchFixedCost.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{fixedCost ? "Editar costo fijo" : "Nuevo costo fijo"}</DialogTitle>
                    <DialogDescription>
                        Se suma al total del mes y cambia al instante cuánto necesitás vender.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <FormField
                            control={form.control}
                            name="concept"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Concepto</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej.: Alquiler del local" className="h-11 sm:h-10" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Cualquier gasto que se paga todos los meses, también la cuota de monotributo.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monto</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                    $
                                                </span>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    inputMode="decimal"
                                                    placeholder="0"
                                                    name={field.name}
                                                    ref={field.ref}
                                                    onBlur={field.onBlur}
                                                    value={displayNumber(field.value)}
                                                    onChange={(event) => field.onChange(
                                                        parseNumericInput(event.target.value, event.target.valueAsNumber),
                                                    )}
                                                    className="h-11 pl-7 tabular-nums sm:h-10"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription>Lo que pagás por este concepto en el mes.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="month"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mes</FormLabel>
                                        <FormControl>
                                            <Input type="month" className="h-11 sm:h-10" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending} className="gap-2">
                                {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                                {isPending
                                    ? "Guardando…"
                                    : fixedCost ? "Guardar cambios" : "Crear costo fijo"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
