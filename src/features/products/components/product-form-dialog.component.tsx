"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import CompositionLinesField, {
    compositionLinesSchema,
} from "@/features/supplies/components/composition-lines-field.component"
import useGetSupplies from "@/features/supplies/hooks/useGetSupplies.hook"
import { type CompositionLineInput } from "@/features/supplies/types/composition.type"
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
import { useGetCategories } from "../hooks/useGetCategories.hook"
import useGetProductComposition from "../hooks/useGetProductComposition.hook"
import usePatchProduct from "../hooks/usePatchProduct.hook"
import usePostProduct from "../hooks/usePostProduct.hook"
import ProductCostingPreview from "./product-costing-preview.component"
import { type AdminProduct } from "../types/admin-product.type"

const NO_CATEGORY = "none"

const productFormSchema = z.object({
    name: z.string().trim().min(1, "El nombre es obligatorio"),
    description: z.string().trim().max(500, "La descripción es demasiado larga"),
    price: z
        .number({ error: "El precio debe ser 0 o mayor" })
        .refine((value) => value >= 0, "El precio debe ser 0 o mayor"),
    // Vacío es `null`: el producto no tiene margen objetivo y no lleva sugerido.
    target_margin_percentage: z
        .number()
        .refine(
            (value) => value >= 0 && value < 100,
            "El margen objetivo debe estar entre 0 y 99,99",
        )
        .nullable(),
    category_id: z.string(),
    img_url: z
        .string()
        .trim()
        .refine(
            (value) => value === "" || value.startsWith("/") || URL.canParse(value),
            "Tiene que ser una URL o una ruta que arranque con /",
        ),
    lines: compositionLinesSchema,
})

type ProductFormValues = z.infer<typeof productFormSchema>

const emptyForm: ProductFormValues = {
    name: "",
    description: "",
    price: Number.NaN,
    target_margin_percentage: null,
    category_id: NO_CATEGORY,
    img_url: "",
    lines: [],
}

const toFormValues = (product: AdminProduct, lines: CompositionLineInput[]): ProductFormValues => ({
    name: product.name,
    description: product.description ?? "",
    price: product.price,
    target_margin_percentage: product.target_margin_percentage,
    category_id: product.category_id === null ? NO_CATEGORY : String(product.category_id),
    img_url: product.img_url ?? "",
    lines,
})

// Un input numérico vacío no tiene número que reportar: NaN deja que el schema
// lo rechace en vez de que llegue un 0 que el usuario nunca escribió.
const parseNumericInput = (value: string, valueAsNumber: number) =>
    value === "" ? Number.NaN : valueAsNumber

// El margen objetivo sí tiene un vacío con significado: el producto no lo define.
const parseOptionalNumericInput = (value: string, valueAsNumber: number) =>
    value === "" ? null : valueAsNumber

const displayNumber = (value: number) => (Number.isNaN(value) ? "" : value)

const displayOptionalNumber = (value: number | null) =>
    value === null || Number.isNaN(value) ? "" : value

interface ProductFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product?: AdminProduct | null
}

export default function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
    const postProduct = usePostProduct()
    const patchProduct = usePatchProduct()

    const compositionProductId = open && product ? product.id : null
    const { data: composition } = useGetProductComposition(compositionProductId)
    const { data: supplies } = useGetSupplies({ onlyActive: true })
    const { data: categories } = useGetCategories()

    const categoryOptions = (categories ?? []).flatMap((category) => [
        { id: category.id, label: category.name },
        ...(category.subCategories ?? []).map((subCategory) => ({
            id: subCategory.id,
            label: `${category.name} › ${subCategory.name}`,
        })),
    ])

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
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

        if (!product) {
            isFormLoaded.current = true
            form.reset(emptyForm)
            return
        }

        if (composition === undefined) return

        isFormLoaded.current = true
        form.reset(toFormValues(product, composition))
    }, [open, product, composition])

    const onSubmit = (values: ProductFormValues) => {
        const input = {
            name: values.name,
            description: values.description || null,
            price: values.price,
            target_margin_percentage: values.target_margin_percentage,
            category_id: values.category_id === NO_CATEGORY ? null : Number(values.category_id),
            img_url: values.img_url || null,
            lines: values.lines,
        }

        if (product) {
            const { lines, ...productValues } = input

            patchProduct.mutate({ id: product.id, values: productValues, lines }, {
                onSuccess: () => {
                    toast.success("Producto actualizado")
                    onOpenChange(false)
                },
            })
            return
        }

        postProduct.mutate(input, {
            onSuccess: () => {
                toast.success("Producto creado")
                onOpenChange(false)
            },
        })
    }

    // El costo y el margen se recalculan mientras el usuario escribe: es donde
    // decide el precio, así que el número tiene que estar sin guardar nada.
    const watchedLines = form.watch("lines")
    const watchedPrice = form.watch("price")
    const watchedTargetMargin = form.watch("target_margin_percentage")

    const isPending = postProduct.isPending || patchProduct.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{product ? "Editar producto" : "Nuevo producto"}</DialogTitle>
                    <DialogDescription>
                        Lo que se vende. Su composición es lo que descuenta del stock en cada venta.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_1fr]">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Hamburguesa clásica" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio de venta</FormLabel>
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
                                name="target_margin_percentage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Margen objetivo (%)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="99.99"
                                                step="0.01"
                                                placeholder="Sin margen"
                                                name={field.name}
                                                ref={field.ref}
                                                onBlur={field.onBlur}
                                                value={displayOptionalNumber(field.value)}
                                                onChange={(event) => field.onChange(
                                                    parseOptionalNumericInput(
                                                        event.target.value,
                                                        event.target.valueAsNumber,
                                                    ),
                                                )}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Vacío deja al producto sin precio sugerido.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="category_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoría</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
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

                        <FormField
                            control={form.control}
                            name="img_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Imagen (opcional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            inputMode="url"
                                            placeholder="https://ejemplo.com/hamburguesa.jpg"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        URL de la foto que se ve en el POS. Sin imagen, la tarjeta
                                        muestra un ícono con el nombre del producto.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción (opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea rows={2} placeholder="Con papas" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="rounded-lg border bg-muted/30 p-3">
                            <p className="mb-3 text-sm text-muted-foreground">
                                Qué consume este producto cada vez que se vende una unidad.
                            </p>
                            <CompositionLinesField
                                supplies={supplies ?? []}
                                emptyMessage="Sin composición: la venta de este producto no descuenta stock."
                            />
                            <FormDescription className="mt-3">
                                Un producto sin líneas no genera movimientos de stock al venderse.
                            </FormDescription>

                            <div className="mt-4">
                                <ProductCostingPreview
                                    lines={watchedLines}
                                    price={watchedPrice}
                                    targetMarginPercentage={watchedTargetMargin}
                                    supplies={supplies ?? []}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {product ? "Guardar cambios" : "Crear producto"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
