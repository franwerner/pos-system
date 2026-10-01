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
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import usePostStockMovement from "../hooks/usePostStockMovement.hook"
import {
    MANUAL_MOVEMENT_TYPE_LABELS,
    MANUAL_MOVEMENT_TYPES,
    MOVEMENT_DIRECTIONS,
    MOVEMENT_DIRECTION_LABELS,
    type ManualMovementType,
    type MovementDirection,
    type SupplyStock,
} from "../types/stock.type"
import { formatQuantity } from "./stock-table.component"

const QUANTITY_ERROR = "Cargá una cantidad mayor a 0."

const movementFormSchema = z.object({
    type: z.enum(MANUAL_MOVEMENT_TYPES),
    direction: z.enum(MOVEMENT_DIRECTIONS),
    quantity: z
        .number({ error: QUANTITY_ERROR })
        .refine((value) => value > 0, QUANTITY_ERROR),
    note: z.string().trim().max(500, "La nota es demasiado larga"),
})

type MovementFormValues = z.infer<typeof movementFormSchema>

const emptyForm: MovementFormValues = {
    type: "waste",
    direction: "out",
    quantity: Number.NaN,
    note: "",
}

// Un input numérico vacío no tiene número que reportar: NaN deja que el schema
// lo rechace en vez de que llegue un 0 que el usuario nunca escribió.
const parseNumericInput = (value: string, valueAsNumber: number) =>
    value === "" ? Number.NaN : valueAsNumber

const displayNumber = (value: number) => (Number.isNaN(value) ? "" : value)

const KIND_HELP: Record<ManualMovementType, string> = {
    waste: "Pérdida: mercadería que ya no está porque se quemó, se venció o se cayó. Esa plata se perdió.",
    adjustment: "Ajuste: el número estaba mal cargado y lo corregís. No se perdió nada, solo estaba mal anotado.",
}

const QUANTITY_HELP: Record<ManualMovementType, string> = {
    waste: "Cargala en positivo: una pérdida siempre resta del stock.",
    adjustment: "Cargala en positivo: la dirección decide si suma o resta.",
}

/** Tipo de movimiento: control segmentado Pérdida/Ajuste (reemplaza el `Select` original). */
function MovementTypeToggle({
    value,
    onChange,
}: {
    value: ManualMovementType
    onChange: (value: ManualMovementType) => void
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <span id="movimiento-tipo" className="text-sm font-semibold">
                Tipo de movimiento
            </span>
            <Tabs
                value={value}
                onValueChange={(next) => onChange(next as ManualMovementType)}
                aria-labelledby="movimiento-tipo"
            >
                <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl p-1">
                    {MANUAL_MOVEMENT_TYPES.map((type) => (
                        <TabsTrigger key={type} value={type} className="h-11 rounded-[9px] font-semibold sm:h-9">
                            {MANUAL_MOVEMENT_TYPE_LABELS[type]}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            <p className="text-[13px] text-muted-foreground">{KIND_HELP[value]}</p>
        </div>
    )
}

/** Dirección: solo para Ajuste (la Pérdida siempre resta, no es una decisión del usuario). */
function DirectionToggle({
    value,
    onChange,
}: {
    value: MovementDirection
    onChange: (value: MovementDirection) => void
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <span id="movimiento-direccion" className="text-sm font-semibold">
                Dirección
            </span>
            <Tabs
                value={value}
                onValueChange={(next) => onChange(next as MovementDirection)}
                aria-labelledby="movimiento-direccion"
            >
                <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl p-1">
                    {MOVEMENT_DIRECTIONS.map((direction) => (
                        <TabsTrigger key={direction} value={direction} className="h-11 rounded-[9px] font-semibold sm:h-9">
                            {MOVEMENT_DIRECTION_LABELS[direction]}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>
    )
}

interface StockMovementFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    supplyStock: SupplyStock | null
}

export default function StockMovementFormDialog({
    open,
    onOpenChange,
    supplyStock,
}: StockMovementFormDialogProps) {
    const postStockMovement = usePostStockMovement()

    const form = useForm<MovementFormValues>({
        resolver: zodResolver(movementFormSchema),
        defaultValues: emptyForm,
    })

    useEffect(() => {
        if (open) form.reset(emptyForm)
    }, [open])

    const type = form.watch("type")

    const onSubmit = (values: MovementFormValues) => {
        if (!supplyStock) return

        postStockMovement.mutate({
            supply_id: supplyStock.supply_id,
            type: values.type,
            quantity: values.quantity,
            direction: values.direction,
            note: values.note || null,
        }, {
            onSuccess: () => {
                toast.success(values.type === "waste" ? "Pérdida registrada" : "Ajuste registrado")
                onOpenChange(false)
            },
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Pérdida o ajuste</DialogTitle>
                    <DialogDescription>
                        {supplyStock
                            ? `“${supplyStock.name}” tiene hoy ${formatQuantity(supplyStock.current_stock)} ${supplyStock.unit}.`
                            : ""}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-[18px]">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <MovementTypeToggle value={field.value} onChange={field.onChange} />
                                </FormItem>
                            )}
                        />

                        {type === "adjustment" && (
                            <FormField
                                control={form.control}
                                name="direction"
                                render={({ field }) => (
                                    <FormItem>
                                        <DirectionToggle value={field.value} onChange={field.onChange} />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Cantidad {supplyStock ? `(${supplyStock.unit})` : ""}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.001"
                                            autoFocus
                                            placeholder="0"
                                            name={field.name}
                                            ref={field.ref}
                                            onBlur={field.onBlur}
                                            value={displayNumber(field.value)}
                                            onChange={(event) => field.onChange(
                                                parseNumericInput(event.target.value, event.target.valueAsNumber),
                                            )}
                                            className="h-11 tabular-nums sm:h-10"
                                        />
                                    </FormControl>
                                    <FormDescription>{QUANTITY_HELP[type]}</FormDescription>
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
                                        <Input placeholder="Ej.: Se venció una bandeja" className="h-11 sm:h-10" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={postStockMovement.isPending}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={postStockMovement.isPending} className="gap-2">
                                {postStockMovement.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                                {postStockMovement.isPending ? "Guardando…" : "Registrar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
