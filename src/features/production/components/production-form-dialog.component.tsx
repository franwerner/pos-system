"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/shared/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form"
import { Input } from "@/shared/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { DialogShell } from "@/shared/components/dialog-shell.component"
import { Money } from "@/shared/components/money.component"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import useGetProducibleSupplies from "../hooks/useGetProducibleSupplies.hook"
import useGetProductionComponents from "../hooks/useGetProductionComponents.hook"
import usePostProduction from "../hooks/usePostProduction.hook"
import {
    calculateProductionCost,
    calculateProductionUnitCost,
} from "../services/calculateProductionCost.service"
import ProductionComponentsPreview from "./production-components-preview.component"

const productionFormSchema = z.object({
    supply_id: z
        .number({ error: "Elegí un preparado" })
        .refine((value) => value > 0, "Elegí un preparado"),
    quantity: z
        .number({ error: "Cargá cuántas unidades se produjeron (más de 0)." })
        .refine((value) => value > 0, "Cargá cuántas unidades se produjeron (más de 0)."),
    produced_at: z.string().min(1, "La fecha es obligatoria"),
    note: z.string().trim().max(500, "La nota es demasiado larga"),
})

type ProductionFormValues = z.infer<typeof productionFormSchema>

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = (): ProductionFormValues => ({
    supply_id: Number.NaN,
    quantity: Number.NaN,
    produced_at: today(),
    note: "",
})

// Un input numérico vacío no tiene número que reportar: NaN deja que el schema
// lo rechace en vez de que llegue un 0 que el usuario nunca escribió.
const parseNumericInput = (value: string, valueAsNumber: number) =>
    value === "" ? Number.NaN : valueAsNumber

const displayNumber = (value: number) => (Number.isNaN(value) ? "" : value)

const toTimestamp = (date: string) => new Date(`${date}T12:00:00`).toISOString()

/** Resumen de escritorio: el costo unitario es el protagonista. */
function SummaryCards({ pending, message, consumed, unitCost, recipeNote }: {
    pending: boolean
    message: string
    consumed: number
    unitCost: number
    recipeNote: string
}) {
    return (
        <div className="hidden grid-cols-[0.8fr_1.2fr] gap-3 sm:grid">
            <div className="flex flex-col justify-center gap-1.5 rounded-xl border border-border bg-card px-[18px] py-4">
                <span className="text-sm font-semibold text-muted-foreground">Costo consumido</span>
                {pending
                    ? <span className="text-sm text-muted-foreground">{message}</span>
                    : <Money value={consumed} decimals={2} className="text-2xl" />}
                <span className="text-[13px] text-muted-foreground">total de la tanda</span>
            </div>
            <div className="flex flex-col gap-1.5 rounded-xl border-[1.5px] border-brand bg-accent px-[18px] py-4">
                <span className="text-sm font-semibold text-accent-foreground">Costo unitario</span>
                {pending ? (
                    <span className="text-sm text-muted-foreground">{message}</span>
                ) : (
                    <>
                        <span className="flex items-baseline gap-1.5">
                            <Money value={unitCost} decimals={2} size="hero" />
                            <span className="text-sm text-muted-foreground">por u</span>
                        </span>
                        <span className="text-[13px] text-accent-foreground">{recipeNote}</span>
                    </>
                )}
            </div>
        </div>
    )
}

/** Resumen de celular: fijo en el pie, arriba de los botones. */
function SummaryBar({ pending, message, consumed, unitCost }: {
    pending: boolean
    message: string
    consumed: number
    unitCost: number
}) {
    if (pending) {
        return (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3.5 py-3 sm:hidden">
                <span className="whitespace-nowrap text-sm font-semibold">Costo unitario</span>
                <span className="text-right text-sm text-muted-foreground">{message}</span>
            </div>
        )
    }
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border-[1.5px] border-brand bg-accent px-3.5 py-2.5 sm:hidden">
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-accent-foreground">Costo unitario</span>
                <span className="text-[13px] tabular-nums text-muted-foreground">Consumido {formatCurrency(consumed)}</span>
            </div>
            <Money value={unitCost} decimals={2} size="lg" className="text-[28px]" />
        </div>
    )
}

interface ProductionFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function ProductionFormDialog({ open, onOpenChange }: ProductionFormDialogProps) {
    const postProduction = usePostProduction()
    const { data: supplies } = useGetProducibleSupplies()

    const form = useForm<ProductionFormValues>({
        resolver: zodResolver(productionFormSchema),
        defaultValues: emptyForm(),
    })

    useEffect(() => {
        if (open) form.reset(emptyForm())
    }, [open])

    const supplyId = form.watch("supply_id")
    const quantity = form.watch("quantity")
    const supplySelected = !Number.isNaN(supplyId)

    const selectedSupply = (supplies ?? []).find((supply) => supply.id === supplyId)
    const { data: components } = useGetProductionComponents(supplySelected ? supplyId : null)

    const producedQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 0
    const lines = components ?? []
    const noComponents = supplySelected && lines.length === 0

    const totalCost = producedQuantity > 0 ? calculateProductionCost(lines, producedQuantity) : 0
    const unitCost = producedQuantity > 0 ? calculateProductionUnitCost(lines, producedQuantity) : 0

    // El resumen nunca muestra $0: mientras falte un dato, dice qué falta en su lugar.
    const summaryPending = !supplySelected || noComponents || producedQuantity <= 0
    const summaryMessage = !supplySelected
        ? "Aparece al elegir un preparado"
        : noComponents
            ? "Sin componentes no hay costo"
            : "Cargá las unidades"

    const submitDisabled = noComponents

    const onSubmit = (values: ProductionFormValues) => {
        if (lines.length === 0) {
            toast.error("El preparado no tiene componentes cargados")
            return
        }

        postProduction.mutate({
            supply_id: values.supply_id,
            quantity: values.quantity,
            produced_at: toTimestamp(values.produced_at),
            note: values.note || null,
        }, {
            onSuccess: () => {
                toast.success("Producción registrada: bajaron los componentes y subió el preparado")
                onOpenChange(false)
            },
            onError: (error) => toast.error(error.message),
        })
    }

    const submitting = postProduction.isPending

    return (
        <DialogShell
            open={open}
            onOpenChange={onOpenChange}
            title="Nueva producción"
            description="Registrá una tanda: bajan los componentes y sube el preparado."
            mobileBarTitle="Nueva producción"
            widthClass="sm:max-w-[860px]"
            footer={
                <>
                    <SummaryBar pending={summaryPending} message={summaryMessage} consumed={totalCost} unitCost={unitCost} />
                    <div className="flex gap-2.5 sm:contents">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-12 sm:h-10"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            form="production-form"
                            disabled={submitDisabled || submitting}
                            className="h-12 flex-1 gap-2 sm:h-10 sm:flex-none"
                        >
                            {submitting
                                ? (<><Loader2 className="size-4 animate-spin" aria-hidden /> Guardando…</>)
                                : "Registrar producción"}
                        </Button>
                    </div>
                </>
            }
        >
            <Form {...form}>
                <form id="production-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                        <FormField
                            control={form.control}
                            name="supply_id"
                            render={({ field }) => (
                                <FormItem className="col-span-2 sm:col-span-1">
                                    <FormLabel>Preparado</FormLabel>
                                    <Select
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        value={Number.isNaN(field.value) ? "" : String(field.value)}>
                                        <FormControl>
                                            <SelectTrigger className="h-11 w-full sm:h-10">
                                                <SelectValue placeholder="Elegí un preparado" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {(supplies ?? []).map((supply) => (
                                                <SelectItem key={supply.id} value={String(supply.id)}>
                                                    {supply.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span className="text-[13px] text-muted-foreground">
                                        Solo preparados activos y con componentes cargados.
                                    </span>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem className="col-span-2 sm:col-span-1">
                                    <FormLabel>
                                        Unidades producidas {selectedSupply && `(${selectedSupply.unit})`}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.001"
                                            inputMode="decimal"
                                            placeholder="0"
                                            className="h-11 tabular-nums sm:h-10"
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
                            name="produced_at"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha</FormLabel>
                                    <FormControl>
                                        <Input type="date" className="h-11 tabular-nums sm:h-10" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nota (opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej.: Tanda de la mañana" className="h-11 sm:h-10" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <ProductionComponentsPreview
                        supplySelected={supplySelected}
                        supplyName={selectedSupply?.name}
                        supplyUnit={selectedSupply?.unit}
                        components={lines}
                        producedQuantity={producedQuantity}
                    />

                    <SummaryCards
                        pending={summaryPending}
                        message={summaryMessage}
                        consumed={totalCost}
                        unitCost={unitCost}
                        recipeNote={`Este es el costo que va a usar cada receta con ${selectedSupply?.name ?? "este preparado"}.`}
                    />
                </form>
            </Form>
        </DialogShell>
    )
}
