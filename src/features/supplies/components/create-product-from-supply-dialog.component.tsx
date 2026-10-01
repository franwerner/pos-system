"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { useGetCategories } from "@/features/products/hooks/useGetCategories.hook"
import usePostProduct from "@/features/products/hooks/usePostProduct.hook"
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
import { type Supply } from "../types/supply.type"

const NO_CATEGORY = "none"

const formSchema = z.object({
    name: z.string().trim().min(1, "El nombre es obligatorio"),
    price: z
        .number({ error: "El precio debe ser 0 o mayor" })
        .refine((value) => value >= 0, "El precio debe ser 0 o mayor"),
    category_id: z.string(),
})

type FormValues = z.infer<typeof formSchema>

// Un input numérico vacío no tiene número que reportar: NaN deja que el schema
// lo rechace en vez de que llegue un 0 que el usuario nunca escribió.
const parseNumericInput = (value: string, valueAsNumber: number) =>
    value === "" ? Number.NaN : valueAsNumber

const displayNumber = (value: number) => (Number.isNaN(value) ? "" : value)

interface CreateProductFromSupplyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    supply: Supply | null
}

export default function CreateProductFromSupplyDialog({
    open,
    onOpenChange,
    supply,
}: CreateProductFromSupplyDialogProps) {
    const postProduct = usePostProduct()
    const { data: categories } = useGetCategories()

    const categoryOptions = (categories ?? []).flatMap((category) => [
        { id: category.id, label: category.name },
        ...(category.subCategories ?? []).map((subCategory) => ({
            id: subCategory.id,
            label: `${category.name} › ${subCategory.name}`,
        })),
    ])

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", price: Number.NaN, category_id: NO_CATEGORY },
    })

    useEffect(() => {
        if (open) {
            form.reset({
                name: supply?.name ?? "",
                price: Number.NaN,
                category_id: NO_CATEGORY,
            })
        }
    }, [open, supply])

    const onSubmit = (values: FormValues) => {
        if (!supply) return

        postProduct.mutate({
            name: values.name,
            description: null,
            price: values.price,
            target_margin_percentage: null,
            category_id: values.category_id === NO_CATEGORY ? null : Number(values.category_id),
            img_url: null,
            lines: [{ supply_id: supply.id, quantity: 1 }],
        }, {
            onSuccess: () => {
                toast.success("Producto creado con una línea de 1 unidad de este insumo")
                onOpenChange(false)
            },
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Crear producto</DialogTitle>
                    <DialogDescription>
                        {supply
                            ? `Se crea un producto con una composición de 1 ${supply.unit} de “${supply.name}”.`
                            : null}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-[18px]">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del producto</FormLabel>
                                    <FormControl>
                                        <Input className="h-11" {...field} />
                                    </FormControl>
                                    <FormDescription>Precargado con el nombre del insumo. Podés cambiarlo.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio de venta</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    inputMode="decimal"
                                                    autoFocus
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="category_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoría</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11 w-full">
                                                    <SelectValue placeholder="Sin categoría" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={NO_CATEGORY}>Sin categoría</SelectItem>
                                                {categoryOptions.map((option) => (
                                                    <SelectItem key={option.id} value={String(option.id)}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={postProduct.isPending}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={postProduct.isPending} className="gap-2">
                                {postProduct.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                                {postProduct.isPending ? "Guardando…" : "Crear producto"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
