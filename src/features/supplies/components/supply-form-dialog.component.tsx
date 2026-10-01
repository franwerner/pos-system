"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
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
import { Separator } from "@/shared/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
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
    type SupplyOrigin,
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

/** Origen: control segmentado Comprado / Preparado (reemplaza el `Select` original). */
function OriginToggle({ value, onChange }: { value: SupplyOrigin; onChange: (value: SupplyOrigin) => void }) {
    return (
        <div className="flex min-w-0 flex-col gap-1.5">
            <span id="insumo-origen" className="text-sm font-semibold">Origen</span>
            <Tabs value={value} onValueChange={(next) => onChange(next as SupplyOrigin)} aria-labelledby="insumo-origen">
                <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl p-1">
                    {SUPPLY_ORIGINS.map((origin) => (
                        <TabsTrigger key={origin} value={origin} className="h-11 rounded-[9px] font-semibold sm:h-9">
                            {SUPPLY_ORIGIN_LABELS[origin]}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>
    )
}

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
    const watchedName = form.watch("name")
    const prepared = origin === "produced"

    useEffect(() => {
        // Un preparado no se compra: al pasar a "Preparado" se vacía la composición
        // heredada (mismo comportamiento que antes del reskin).
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
                        {supply
                            ? `${watchedName || supply.name} · los cambios se usan en el próximo costeo.`
                            : "Cargá cómo se compra y cuánto rinde. Después lo vas a poder usar en recetas."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-[18px]">
                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej.: Carne picada" className="h-11" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="origin"
                                render={({ field }) => (
                                    <FormItem>
                                        <OriginToggle value={field.value} onChange={field.onChange} />
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
                                                <SelectTrigger className="h-11 w-full">
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
                                                <SelectTrigger className="h-11 w-full">
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
                                name="purchase_price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio de compra</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    inputMode="decimal"
                                                    disabled={prepared}
                                                    name={field.name}
                                                    ref={field.ref}
                                                    onBlur={field.onBlur}
                                                    value={displayNumber(field.value)}
                                                    onChange={(event) => field.onChange(
                                                        parseNumericInput(event.target.value, event.target.valueAsNumber),
                                                    )}
                                                    className="h-11 pl-7 tabular-nums"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            {prepared
                                                ? "Un preparado no se compra: su costo sale de la última producción."
                                                : "Por unidad de medida: por gramo, por mililitro o por unidad."}
                                        </FormDescription>
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
                                                className="h-11 tabular-nums"
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
                                                className="h-11 tabular-nums"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Por debajo de este número, el insumo aparece con aviso en Stock.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {prepared && (
                            <>
                                <Separator />
                                <div className="flex flex-col gap-2.5">
                                    <p className="text-[13px] text-muted-foreground">
                                        Qué consume este preparado cada vez que se produce una unidad.
                                    </p>
                                    <CompositionLinesField
                                        supplies={supplies ?? []}
                                        excludedSupplyId={supply?.id}
                                        emptyMessage="Sin componentes: el preparado no consume nada al producirse."
                                    />
                                </div>
                            </>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending} className="gap-2">
                                {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                                {isPending ? "Guardando…" : supply ? "Guardar cambios" : "Crear insumo"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
