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
import { Textarea } from "@/shared/components/ui/textarea"
import usePostStockMovement from "../hooks/usePostStockMovement.hook"
import {
    MANUAL_MOVEMENT_TYPE_LABELS,
    MANUAL_MOVEMENT_TYPES,
    MOVEMENT_DIRECTION_LABELS,
    MOVEMENT_DIRECTIONS,
    type SupplyStock,
} from "../types/stock.type"

const movementFormSchema = z.object({
    type: z.enum(MANUAL_MOVEMENT_TYPES),
    direction: z.enum(MOVEMENT_DIRECTIONS),
    quantity: z
        .number({ error: "La cantidad debe ser mayor a 0" })
        .refine((value) => value > 0, "La cantidad debe ser mayor a 0"),
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
                            ? `"${supplyStock.name}" tiene hoy ${supplyStock.current_stock} ${supplyStock.unit}.`
                            : ""}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de movimiento</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {MANUAL_MOVEMENT_TYPES.map((movementType) => (
                                                <SelectItem key={movementType} value={movementType}>
                                                    {MANUAL_MOVEMENT_TYPE_LABELS[movementType]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        {type === "waste"
                                            ? "Pérdida: mercadería que ya no está porque se quemó, se venció o se cayó. Esa plata se perdió."
                                            : "Ajuste: el número estaba mal cargado y lo corregís. No se perdió nada, solo estaba mal anotado."}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {type === "adjustment" && (
                            <FormField
                                control={form.control}
                                name="direction"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dirección</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {MOVEMENT_DIRECTIONS.map((direction) => (
                                                    <SelectItem key={direction} value={direction}>
                                                        {MOVEMENT_DIRECTION_LABELS[direction]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cantidad {supplyStock ? `(${supplyStock.unit})` : ""}</FormLabel>
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
                                    <FormDescription>
                                        {type === "waste"
                                            ? "Cargala en positivo: una pérdida siempre resta del stock."
                                            : "Cargala en positivo: la dirección decide si suma o resta."}
                                    </FormDescription>
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
                                        <Textarea rows={3} placeholder="Se venció una bandeja" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={postStockMovement.isPending}>
                                Registrar movimiento
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
