"use client"

import { Plus, Trash2 } from "lucide-react"
import { useFieldArray, useFormContext } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/shared/components/ui/button"
import {
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
import { type Supply } from "../types/supply.type"

export const compositionLinesSchema = z
    .array(z.object({
        supply_id: z
            .number({ error: "Elegí un insumo" })
            .refine((value) => value > 0, "Elegí un insumo"),
        quantity: z
            .number({ error: "La cantidad debe ser mayor a 0" })
            .refine((value) => value > 0, "La cantidad debe ser mayor a 0"),
    }))

type CompositionFormShape = {
    lines: { supply_id: number; quantity: number }[]
}

const emptyLine = { supply_id: Number.NaN, quantity: Number.NaN }

// Un input numérico vacío no tiene número que reportar: NaN deja que el schema
// lo rechace en vez de que llegue un 0 que el usuario nunca escribió.
const parseNumericInput = (value: string, valueAsNumber: number) =>
    value === "" ? Number.NaN : valueAsNumber

const displayNumber = (value: number) => (Number.isNaN(value) ? "" : value)

interface CompositionLinesFieldProps {
    supplies: Supply[]
    excludedSupplyId?: number
    emptyMessage: string
}

export default function CompositionLinesField({
    supplies,
    excludedSupplyId,
    emptyMessage,
}: CompositionLinesFieldProps) {
    const form = useFormContext<CompositionFormShape>()
    const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" })
    const lines = form.watch("lines")

    // La base pide líneas únicas por insumo y prohíbe que un preparado se consuma
    // a sí mismo: el select los saca antes de que el usuario los pueda elegir.
    const availableSupplies = (index: number) => supplies.filter((supply) =>
        supply.id !== excludedSupplyId
        && (supply.id === lines[index]?.supply_id
            || !lines.some((line) => line.supply_id === supply.id)))

    const unitOf = (supplyId: number) => supplies.find((supply) => supply.id === supplyId)?.unit

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <FormLabel>Composición</FormLabel>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => append({ ...emptyLine })}>
                    <Plus className="h-4 w-4" />
                    Agregar insumo
                </Button>
            </div>

            {fields.length === 0 && (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    {emptyMessage}
                </p>
            )}

            {fields.map((line, index) => (
                <div
                    key={line.id}
                    className="grid grid-cols-1 items-start gap-3 rounded-lg border p-3 sm:grid-cols-[2fr_1fr_auto]">
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
                                        {availableSupplies(index).map((supply) => (
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
                                <FormLabel className="text-xs">
                                    Cantidad {unitOf(lines[index]?.supply_id) && `(${unitOf(lines[index].supply_id)})`}
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

                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="sm:mt-6"
                        onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
        </div>
    )
}
