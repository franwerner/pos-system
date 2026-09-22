"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import { useEffect } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import useGetSupplies from "@/features/supplies/hooks/useGetSupplies.hook"
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
import usePostPurchase from "../hooks/usePostPurchase.hook"
import { calculatePurchaseTotal } from "../services/calculatePurchaseTotal.service"

const purchaseFormSchema = z.object({
    supplier_name: z.string().trim().max(120, "El proveedor es demasiado largo"),
    purchased_at: z.string().min(1, "La fecha es obligatoria"),
    note: z.string().trim().max(500, "La nota es demasiado larga"),
    lines: z
        .array(z.object({
            supply_id: z
                .number({ error: "Elegí un insumo" })
                .refine((value) => value > 0, "Elegí un insumo"),
            quantity: z
                .number({ error: "La cantidad debe ser mayor a 0" })
                .refine((value) => value > 0, "La cantidad debe ser mayor a 0"),
            unit_price: z
                .number({ error: "El precio unitario debe ser 0 o mayor" })
                .refine((value) => value >= 0, "El precio unitario debe ser 0 o mayor"),
        }))
        .min(1, "Cargá al menos una línea"),
})

type PurchaseFormValues = z.infer<typeof purchaseFormSchema>

const emptyLine = { supply_id: Number.NaN, quantity: Number.NaN, unit_price: Number.NaN }

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = (): PurchaseFormValues => ({
    supplier_name: "",
    purchased_at: today(),
    note: "",
    lines: [{ ...emptyLine }],
})

// Un input numérico vacío no tiene número que reportar: NaN deja que el schema
// lo rechace en vez de que llegue un 0 que el usuario nunca escribió.
const parseNumericInput = (value: string, valueAsNumber: number) =>
    value === "" ? Number.NaN : valueAsNumber

const displayNumber = (value: number) => (Number.isNaN(value) ? "" : value)

const toTimestamp = (date: string) => new Date(`${date}T12:00:00`).toISOString()

interface PurchaseFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function PurchaseFormDialog({ open, onOpenChange }: PurchaseFormDialogProps) {
    const postPurchase = usePostPurchase()
    const { data: supplies } = useGetSupplies({ onlyActive: true })

    const form = useForm<PurchaseFormValues>({
        resolver: zodResolver(purchaseFormSchema),
        defaultValues: emptyForm(),
    })

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" })

    useEffect(() => {
        if (open) form.reset(emptyForm())
    }, [open])

    const lines = form.watch("lines")

    const total = calculatePurchaseTotal(
        lines
            .filter((line) => line.quantity > 0 && line.unit_price >= 0)
            .map((line) => ({ quantity: line.quantity, unit_price: line.unit_price })),
    )

    const onSubmit = (values: PurchaseFormValues) => {
        postPurchase.mutate({
            supplier_name: values.supplier_name || null,
            purchased_at: toTimestamp(values.purchased_at),
            note: values.note || null,
            lines: values.lines,
        }, {
            onSuccess: () => {
                toast.success("Compra registrada: el stock y los precios quedaron actualizados")
                onOpenChange(false)
            },
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Nueva compra</DialogTitle>
                    <DialogDescription>
                        Cada línea ingresa stock del insumo y actualiza su precio de compra.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="supplier_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Proveedor (opcional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Distribuidora del Centro" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="purchased_at"
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

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <FormLabel>Líneas</FormLabel>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => append({ ...emptyLine })}>
                                    <Plus className="h-4 w-4" />
                                    Agregar línea
                                </Button>
                            </div>

                            {fields.map((line, index) => (
                                <div
                                    key={line.id}
                                    className="grid grid-cols-1 items-start gap-3 rounded-lg border p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
                                    <FormField
                                        control={form.control}
                                        name={`lines.${index}.supply_id`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Insumo</FormLabel>
                                                <Select
                                                    onValueChange={(value) => field.onChange(Number(value))}
                                                    value={Number.isNaN(field.value) ? "" : String(field.value)}>
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Elegí un insumo" />
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

                                    <FormField
                                        control={form.control}
                                        name={`lines.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Cantidad</FormLabel>
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
                                        name={`lines.${index}.unit_price`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Precio unitario</FormLabel>
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

                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="sm:mt-6"
                                        disabled={fields.length === 1}
                                        onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            {form.formState.errors.lines?.root && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.lines.root.message}
                                </p>
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nota (opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea rows={2} placeholder="Remito 0001-00042" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
                            <span className="text-sm text-muted-foreground">Total de la compra</span>
                            <span className="text-lg font-semibold">{formatCurrency(total)}</span>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={postPurchase.isPending}>
                                Registrar compra
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
