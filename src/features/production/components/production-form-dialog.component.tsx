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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select"
import { Textarea } from "@/shared/components/ui/textarea"
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
        .number({ error: "La cantidad debe ser mayor a 0" })
        .refine((value) => value > 0, "La cantidad debe ser mayor a 0"),
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

    const selectedSupply = (supplies ?? []).find((supply) => supply.id === supplyId)
    const { data: components } = useGetProductionComponents(
        Number.isNaN(supplyId) ? null : supplyId,
    )

    const producedQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 0
    const lines = components ?? []

    const totalCost = producedQuantity > 0 ? calculateProductionCost(lines, producedQuantity) : 0
    const unitCost = producedQuantity > 0 ? calculateProductionUnitCost(lines, producedQuantity) : 0

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
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Nueva producción</DialogTitle>
                    <DialogDescription>
                        Descuenta del stock los componentes del preparado e ingresa las unidades producidas.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="supply_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Preparado</FormLabel>
                                    <Select
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        value={Number.isNaN(field.value) ? "" : String(field.value)}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
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
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Unidades producidas {selectedSupply && `(${selectedSupply.unit})`}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.001"
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
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <ProductionComponentsPreview
                            components={lines}
                            producedQuantity={producedQuantity}
                        />

                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nota (opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea rows={2} placeholder="Tanda de la mañana" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center justify-between gap-4 sm:justify-start">
                                <span className="text-sm text-muted-foreground">Costo consumido</span>
                                <span className="font-medium">{formatCurrency(totalCost)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 sm:justify-start">
                                <span className="text-sm text-muted-foreground">Costo unitario</span>
                                <span className="text-lg font-semibold">{formatCurrency(unitCost)}</span>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={postProduction.isPending}>
                                Registrar producción
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
