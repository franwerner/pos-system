"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, TriangleAlert, Trash2 } from "lucide-react"
import { type ReactNode, useEffect } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import useGetSupplies from "@/features/supplies/hooks/useGetSupplies.hook"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import { Button } from "@/shared/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Separator } from "@/shared/components/ui/separator"
import { DialogShell } from "@/shared/components/dialog-shell.component"
import { Money } from "@/shared/components/money.component"
import { cn } from "@/shared/utils/cn.util"
import usePostPurchase from "../hooks/usePostPurchase.hook"
import { calculateLineAmount, calculatePurchaseTotal } from "../services/calculatePurchaseTotal.service"

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

const lineCountLabel = (count: number) => (count === 1 ? "1 línea" : `${count} líneas`)

/** Campo con prefijo/sufijo ("$", "/gr"): mismo tratamiento visual en toda la línea. */
function AffixInput({
    prefix,
    suffix,
    invalid,
    className,
    inputClassName,
    ref,
    ...inputProps
}: {
    prefix?: ReactNode
    suffix?: ReactNode
    invalid?: boolean
    className?: string
    inputClassName?: string
    ref?: React.Ref<HTMLInputElement>
} & Omit<React.ComponentProps<"input">, "prefix" | "ref">) {
    return (
        <div
            className={cn(
                "flex h-11 min-w-0 items-center gap-2 rounded-md border border-input bg-card px-3 text-[15px] font-medium",
                "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25",
                invalid && "border-destructive ring-[3px] ring-destructive/20",
                className,
            )}
        >
            {prefix && <span className="font-semibold text-muted-foreground">{prefix}</span>}
            <input
                ref={ref}
                aria-invalid={invalid || undefined}
                className={cn(
                    "w-full min-w-0 bg-transparent outline-none placeholder:font-normal placeholder:text-muted-foreground",
                    inputClassName,
                )}
                {...inputProps}
            />
            {suffix && <span className="shrink-0 text-sm text-muted-foreground">{suffix}</span>}
        </div>
    )
}

const GRID = "grid grid-cols-[minmax(0,1fr)_150px_170px_120px_40px] items-center gap-2.5"

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

    const watchedLines = form.watch("lines")

    const total = calculatePurchaseTotal(
        watchedLines
            .filter((line) => line.quantity > 0 && line.unit_price >= 0)
            .map((line) => ({ quantity: line.quantity, unit_price: line.unit_price })),
    )

    const lineErrors = form.formState.errors.lines
    // `errors.lines` es un array con una entrada de error por índice (más una prop
    // extra "root" para el `.min(1)`, que `Array.prototype.filter` no recorre):
    // contar las entradas dice cuántas líneas tienen al menos un campo inválido.
    const errorLineCount = Array.isArray(lineErrors) ? lineErrors.filter(Boolean).length : 0
    const alertTitle = errorLineCount > 0
        ? `Revisá ${errorLineCount} ${errorLineCount === 1 ? "línea" : "líneas"} antes de registrar la compra`
        : null

    const canRemoveLines = fields.length > 1

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
            onError: (error) => toast.error(error.message),
        })
    }

    const submitting = postPurchase.isPending

    return (
        <DialogShell
            open={open}
            onOpenChange={onOpenChange}
            title="Nueva compra"
            description="Cargala línea por línea con la factura o el remito al lado."
            mobileBarTitle="Nueva compra"
            widthClass="sm:max-w-[940px]"
            footer={
                <>
                    {/* Celular: total arriba, "Agregar línea" y "Registrar compra" lado a lado */}
                    <div className="flex items-center justify-between sm:hidden">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">Total de la compra</span>
                            <span className="text-[13px] text-muted-foreground">{lineCountLabel(fields.length)}</span>
                        </div>
                        <Money value={total} size="lg" className="text-[28px]" />
                    </div>
                    <div className="flex gap-2.5 sm:hidden">
                        <Button
                            type="button"
                            variant="secondary"
                            className="h-12 flex-1 gap-2"
                            onClick={() => append({ ...emptyLine })}
                        >
                            <Plus className="size-4" aria-hidden />
                            Agregar línea
                        </Button>
                        <Button type="submit" form="purchase-form" disabled={submitting} className="h-12 flex-1 gap-2">
                            {submitting ? (<><Loader2 className="size-4 animate-spin" aria-hidden /> Guardando…</>) : "Registrar compra"}
                        </Button>
                    </div>
                    {/* Escritorio */}
                    <div className="hidden flex-1 items-baseline gap-3.5 sm:flex">
                        <span className="font-semibold text-muted-foreground">Total de la compra</span>
                        <Money value={total} size="lg" className="text-[34px]" />
                        <span className="text-sm text-muted-foreground">{lineCountLabel(fields.length)}</span>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="hidden h-10 sm:inline-flex"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" form="purchase-form" disabled={submitting} className="hidden h-10 gap-2 sm:inline-flex">
                        {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
                        {submitting ? "Guardando…" : "Registrar compra"}
                    </Button>
                </>
            }
        >
            <Form {...form}>
                <form id="purchase-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    {alertTitle && (
                        <Alert className="border-transparent bg-destructive-muted text-destructive-muted-foreground">
                            <TriangleAlert className="size-5" aria-hidden />
                            <AlertTitle className="text-[15px] font-bold">{alertTitle}</AlertTitle>
                            <AlertDescription className="text-sm text-destructive-muted-foreground">
                                No se guardó nada todavía.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[1.2fr_0.8fr_1fr] sm:gap-3.5">
                        <FormField
                            control={form.control}
                            name="supplier_name"
                            render={({ field, fieldState }) => (
                                <FormItem className="col-span-2 sm:col-span-1">
                                    <FormLabel>Proveedor (opcional)</FormLabel>
                                    <FormControl>
                                        <AffixInput
                                            placeholder="Ej.: Distribuidora del Centro"
                                            invalid={!!fieldState.error}
                                            {...field}
                                        />
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
                                        <Input type="date" className="h-11" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>Nota (opcional)</FormLabel>
                                    <FormControl>
                                        <AffixInput
                                            placeholder="Ej.: Remito 0001-00042"
                                            invalid={!!fieldState.error}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Separator className="hidden sm:block" />

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">Líneas de la compra</Label>
                            <span className="hidden text-[13px] text-muted-foreground sm:inline">
                                Tab para pasar de un campo al siguiente
                            </span>
                        </div>

                        <div className={cn(GRID, "hidden text-[13px] font-semibold text-muted-foreground sm:grid")}>
                            <span>Insumo</span><span>Cantidad</span><span>Precio unitario</span>
                            <span className="text-right">Importe</span><span />
                        </div>

                        {/* Escritorio: una fila por línea, pensada para pasar de campo en campo con Tab. */}
                        <div className="hidden flex-col gap-2 sm:flex">
                            {fields.map((field, index) => {
                                const line = watchedLines[index]
                                const selectedSupply = (supplies ?? []).find((supply) => supply.id === line?.supply_id)
                                const unit = selectedSupply?.unit
                                const lineError = lineErrors?.[index]
                                const amount = line && line.quantity > 0 && Number.isFinite(line.unit_price) && line.unit_price >= 0
                                    ? calculateLineAmount({ quantity: line.quantity, unit_price: line.unit_price })
                                    : null

                                return (
                                    <div key={field.id} className="flex flex-col gap-1">
                                        <div className={GRID}>
                                            <FormField
                                                control={form.control}
                                                name={`lines.${index}.supply_id`}
                                                render={({ field: supplyField, fieldState }) => (
                                                    <Select
                                                        value={Number.isNaN(supplyField.value) ? "" : String(supplyField.value)}
                                                        onValueChange={(value) => supplyField.onChange(Number(value))}
                                                    >
                                                        <SelectTrigger
                                                            aria-label="Insumo"
                                                            aria-invalid={!!fieldState.error || undefined}
                                                            className="h-11 w-full min-w-0"
                                                        >
                                                            <SelectValue placeholder="Elegí un insumo" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(supplies ?? []).map((supply) => (
                                                                <SelectItem key={supply.id} value={String(supply.id)}>
                                                                    {supply.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`lines.${index}.quantity`}
                                                render={({ field: quantityField, fieldState }) => (
                                                    <AffixInput
                                                        type="number"
                                                        min="0"
                                                        step="0.001"
                                                        inputMode="decimal"
                                                        aria-label="Cantidad"
                                                        placeholder="0"
                                                        suffix={unit}
                                                        invalid={!!fieldState.error}
                                                        inputClassName="tabular-nums"
                                                        name={quantityField.name}
                                                        ref={quantityField.ref}
                                                        onBlur={quantityField.onBlur}
                                                        value={displayNumber(quantityField.value)}
                                                        onChange={(event) => quantityField.onChange(
                                                            parseNumericInput(event.target.value, event.target.valueAsNumber),
                                                        )}
                                                    />
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`lines.${index}.unit_price`}
                                                render={({ field: priceField, fieldState }) => (
                                                    <AffixInput
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        inputMode="decimal"
                                                        aria-label="Precio unitario"
                                                        placeholder="0"
                                                        prefix="$"
                                                        suffix={unit ? `/${unit}` : undefined}
                                                        invalid={!!fieldState.error}
                                                        inputClassName="tabular-nums"
                                                        name={priceField.name}
                                                        ref={priceField.ref}
                                                        onBlur={priceField.onBlur}
                                                        value={displayNumber(priceField.value)}
                                                        onChange={(event) => priceField.onChange(
                                                            parseNumericInput(event.target.value, event.target.valueAsNumber),
                                                        )}
                                                    />
                                                )}
                                            />
                                            <div className="text-right">
                                                {amount === null
                                                    ? <span className="text-muted-foreground">—</span>
                                                    : <Money value={amount} size="sm" className="text-[15px]" />}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-11 shrink-0"
                                                disabled={!canRemoveLines}
                                                aria-label={selectedSupply ? `Quitar línea de ${selectedSupply.name}` : "Quitar línea"}
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="size-4" aria-hidden />
                                            </Button>
                                        </div>
                                        {(lineError?.supply_id || lineError?.quantity) && (
                                            <div className={cn(GRID, "-mt-1")}>
                                                <p className="text-[13px] font-semibold text-negative">{lineError?.supply_id?.message}</p>
                                                <p className="text-[13px] font-semibold text-negative">{lineError?.quantity?.message}</p>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Celular: una tarjeta por línea (insumo arriba, cantidad y precio lado a lado). */}
                        <div className="flex flex-col gap-3 sm:hidden">
                            {fields.map((field, index) => {
                                const line = watchedLines[index]
                                const selectedSupply = (supplies ?? []).find((supply) => supply.id === line?.supply_id)
                                const unit = selectedSupply?.unit
                                const lineError = lineErrors?.[index]
                                const amount = line && line.quantity > 0 && Number.isFinite(line.unit_price) && line.unit_price >= 0
                                    ? calculateLineAmount({ quantity: line.quantity, unit_price: line.unit_price })
                                    : null

                                return (
                                    <div key={field.id} className="flex flex-col gap-2.5 rounded-[14px] border border-border bg-card p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="min-w-0 flex-1">
                                                <FormField
                                                    control={form.control}
                                                    name={`lines.${index}.supply_id`}
                                                    render={({ field: supplyField, fieldState }) => (
                                                        <Select
                                                            value={Number.isNaN(supplyField.value) ? "" : String(supplyField.value)}
                                                            onValueChange={(value) => supplyField.onChange(Number(value))}
                                                        >
                                                            <SelectTrigger
                                                                aria-label="Insumo"
                                                                aria-invalid={!!fieldState.error || undefined}
                                                                className="h-11 w-full min-w-0"
                                                            >
                                                                <SelectValue placeholder="Elegí un insumo" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {(supplies ?? []).map((supply) => (
                                                                    <SelectItem key={supply.id} value={String(supply.id)}>
                                                                        {supply.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-11 shrink-0"
                                                disabled={!canRemoveLines}
                                                aria-label={selectedSupply ? `Quitar línea de ${selectedSupply.name}` : "Quitar línea"}
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="size-4" aria-hidden />
                                            </Button>
                                        </div>
                                        {lineError?.supply_id && (
                                            <p className="text-[13px] font-semibold text-negative">{lineError.supply_id.message}</p>
                                        )}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex min-w-0 flex-col gap-1.5">
                                                <span className="text-[13px] font-semibold text-muted-foreground">Cantidad</span>
                                                <FormField
                                                    control={form.control}
                                                    name={`lines.${index}.quantity`}
                                                    render={({ field: quantityField, fieldState }) => (
                                                        <AffixInput
                                                            type="number"
                                                            min="0"
                                                            step="0.001"
                                                            inputMode="decimal"
                                                            aria-label="Cantidad"
                                                            placeholder="0"
                                                            suffix={unit}
                                                            invalid={!!fieldState.error}
                                                            inputClassName="tabular-nums"
                                                            name={quantityField.name}
                                                            ref={quantityField.ref}
                                                            onBlur={quantityField.onBlur}
                                                            value={displayNumber(quantityField.value)}
                                                            onChange={(event) => quantityField.onChange(
                                                                parseNumericInput(event.target.value, event.target.valueAsNumber),
                                                            )}
                                                        />
                                                    )}
                                                />
                                                {lineError?.quantity && (
                                                    <p className="text-[13px] font-semibold text-negative">{lineError.quantity.message}</p>
                                                )}
                                            </div>
                                            <div className="flex min-w-0 flex-col gap-1.5">
                                                <span className="text-[13px] font-semibold text-muted-foreground">Precio unitario</span>
                                                <FormField
                                                    control={form.control}
                                                    name={`lines.${index}.unit_price`}
                                                    render={({ field: priceField, fieldState }) => (
                                                        <AffixInput
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            inputMode="decimal"
                                                            aria-label="Precio unitario"
                                                            placeholder="0"
                                                            prefix="$"
                                                            suffix={unit ? `/${unit}` : undefined}
                                                            invalid={!!fieldState.error}
                                                            inputClassName="tabular-nums"
                                                            name={priceField.name}
                                                            ref={priceField.ref}
                                                            onBlur={priceField.onBlur}
                                                            value={displayNumber(priceField.value)}
                                                            onChange={(event) => priceField.onChange(
                                                                parseNumericInput(event.target.value, event.target.valueAsNumber),
                                                            )}
                                                        />
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Importe</span>
                                            {amount === null
                                                ? <span className="text-muted-foreground">—</span>
                                                : <Money value={amount} size="sm" className="text-[15px]" />}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="mt-1 hidden items-center justify-between gap-4 sm:flex">
                            <Button type="button" variant="secondary" className="h-10 gap-2" onClick={() => append({ ...emptyLine })}>
                                <Plus className="size-4" aria-hidden />
                                Agregar línea
                            </Button>
                            <p className="max-w-[440px] text-right text-[13px] text-muted-foreground">
                                El precio que cargues pasa a ser el nuevo precio de compra del insumo y actualiza el costo de los productos que lo usan.
                            </p>
                        </div>
                    </div>
                </form>
            </Form>
        </DialogShell>
    )
}
