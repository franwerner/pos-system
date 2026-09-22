"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useRef } from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select"
import useGetSupplies from "../hooks/useGetSupplies.hook"
import useGetSupplyComposition from "../hooks/useGetSupplyComposition.hook"
import usePatchSupply from "../hooks/usePatchSupply.hook"
import usePostSupply from "../hooks/usePostSupply.hook"
import { type CompositionLineInput } from "../types/composition.type"
import {
    SUPPLY_ORIGIN_LABELS,
    SUPPLY_ORIGINS,
    SUPPLY_TYPE_LABELS,
    SUPPLY_TYPES,
    SUPPLY_UNIT_LABELS,
    SUPPLY_UNITS,
    type Supply,
} from "../types/supply.type"
import CompositionLinesField, { compositionLinesSchema } from "./composition-lines-field.component"

const numberField = (message: string, isValid: (value: number) => boolean) =>
    z.number({ error: message }).refine(isValid, message)

const supplyFormSchema = z.object({
    name: z.string().trim().min(1, "El nombre es obligatorio"),
    type: z.enum(SUPPLY_TYPES),
    origin: z.enum(SUPPLY_ORIGINS),
    unit: z.enum(SUPPLY_UNITS),
    purchase_price: numberField("El precio de compra debe ser 0 o mayor", (value) => value >= 0),
    yield_factor: numberField("El rendimiento debe ser mayor a 0", (value) => value > 0),
    min_stock: numberField("El stock mínimo debe ser 0 o mayor", (value) => value >= 0),
    lines: compositionLinesSchema,
})

type SupplyFormValues = z.infer<typeof supplyFormSchema>

const emptyForm: SupplyFormValues = {
    name: "",
    type: "food",
    origin: "purchased",
    unit: "u",
    purchase_price: 0,
    yield_factor: 1,
    min_stock: 0,
    lines: [],
}

const toFormValues = (supply: Supply, lines: CompositionLineInput[]): SupplyFormValues => ({
    name: supply.name,
    type: supply.type,
    origin: supply.origin,
    unit: supply.unit,
    purchase_price: supply.purchase_price,
    yield_factor: supply.yield_factor,
    min_stock: supply.min_stock,
    lines,
})

// Un input numérico vacío no tiene número que reportar: NaN deja que el schema
// lo rechace en vez de que llegue un 0 que el usuario nunca escribió.
const parseNumericInput = (value: string, valueAsNumber: number) =>
    value === "" ? Number.NaN : valueAsNumber

const displayNumber = (value: number) => (Number.isNaN(value) ? "" : value)

interface SupplyFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    supply?: Supply | null
}

export default function SupplyFormDialog({ open, onOpenChange, supply }: SupplyFormDialogProps) {
    const postSupply = usePostSupply()
    const patchSupply = usePatchSupply()

    const compositionSupplyId = open && supply?.origin === "produced" ? supply.id : null
    const { data: composition } = useGetSupplyComposition(compositionSupplyId)
    const { data: supplies } = useGetSupplies({ onlyActive: true })

    const form = useForm<SupplyFormValues>({
        resolver: zodResolver(supplyFormSchema),
        defaultValues: emptyForm,
    })

    // La composición llega después que el diálogo: sin esta marca, cada refetch
    // volvería a pisar lo que el usuario está escribiendo.
    const isFormLoaded = useRef(false)

    useEffect(() => {
        if (!open) {
            isFormLoaded.current = false
            return
        }

        if (isFormLoaded.current) return

        if (!supply) {
            isFormLoaded.current = true
            form.reset(emptyForm)
            return
        }

        if (compositionSupplyId !== null && composition === undefined) return

        isFormLoaded.current = true
        form.reset(toFormValues(supply, composition ?? []))
    }, [open, supply, composition])

    const origin = form.watch("origin")

    useEffect(() => {
        if (origin !== "produced") form.setValue("lines", [])
    }, [origin])

    const onSubmit = (values: SupplyFormValues) => {
        const { lines, ...supplyValues } = values
        const components = values.origin === "produced" ? lines : []

        if (supply) {
            patchSupply.mutate({ id: supply.id, values: supplyValues, components }, {
                onSuccess: () => {
                    toast.success("Insumo actualizado")
                    onOpenChange(false)
                },
            })
            return
        }

        postSupply.mutate({ ...supplyValues, components }, {
            onSuccess: () => {
                toast.success("Insumo creado")
                onOpenChange(false)
            },
        })
    }

    const isPending = postSupply.isPending || patchSupply.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{supply ? "Editar insumo" : "Nuevo insumo"}</DialogTitle>
                    <DialogDescription>
                        Los insumos son todo lo que tiene stock: ingredientes, packaging y bebidas.
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
                                        <Input placeholder="Carne picada" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                                                {SUPPLY_TYPES.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {SUPPLY_TYPE_LABELS[type]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="unit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unidad</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {SUPPLY_UNITS.map((unit) => (
                                                    <SelectItem key={unit} value={unit}>
                                                        {SUPPLY_UNIT_LABELS[unit]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="origin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Origen</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {SUPPLY_ORIGINS.map((origin) => (
                                                    <SelectItem key={origin} value={origin}>
                                                        {SUPPLY_ORIGIN_LABELS[origin]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <FormField
                                control={form.control}
                                name="purchase_price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio de compra</FormLabel>
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="yield_factor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rendimiento</FormLabel>
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
                                        <FormDescription>1 kg de papa que rinde 750 g pelada: 0,750</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="min_stock"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stock mínimo</FormLabel>
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
                        </div>

                        {origin === "produced" && (
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <p className="mb-3 text-sm text-muted-foreground">
                                    Qué consume este preparado cada vez que se produce una unidad.
                                </p>
                                <CompositionLinesField
                                    supplies={supplies ?? []}
                                    excludedSupplyId={supply?.id}
                                    emptyMessage="Sin componentes: el preparado no consume nada al producirse."
                                />
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {supply ? "Guardar cambios" : "Crear insumo"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
