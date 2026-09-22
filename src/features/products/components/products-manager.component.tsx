"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog"
import { Button } from "@/shared/components/ui/button"
import { Loader } from "@/shared/components/loader.component"
import useGetAdminProducts from "../hooks/useGetAdminProducts.hook"
import usePatchProduct from "../hooks/usePatchProduct.hook"
import { type AdminProduct, type AdminProductFilter } from "../types/admin-product.type"
import ProductFilters from "./product-filters.component"
import ProductFormDialog from "./product-form-dialog.component"
import ProductTable from "./product-table.component"

const defaultFilter: AdminProductFilter = {
    search: "",
    onlyActive: true,
}

export default function ProductsManager() {
    const [filter, setFilter] = useState<AdminProductFilter>(defaultFilter)
    const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [productToToggle, setProductToToggle] = useState<AdminProduct | null>(null)

    const { data: products, isLoading } = useGetAdminProducts(filter)
    const patchProduct = usePatchProduct()

    const openCreateForm = () => {
        setEditingProduct(null)
        setIsFormOpen(true)
    }

    const openEditForm = (product: AdminProduct) => {
        setEditingProduct(product)
        setIsFormOpen(true)
    }

    const confirmToggleActive = () => {
        if (!productToToggle) return

        const isActive = !productToToggle.is_active

        patchProduct.mutate({ id: productToToggle.id, values: { is_active: isActive } }, {
            onSuccess: () => {
                toast.success(isActive ? "Producto reactivado" : "Producto desactivado")
                setProductToToggle(null)
            },
        })
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Productos</h1>
                    <p className="text-sm text-muted-foreground">
                        Lo que se vende, con la composición que descuenta stock en cada venta.
                    </p>
                </div>
                <Button onClick={openCreateForm}>
                    <Plus className="h-4 w-4" />
                    Nuevo producto
                </Button>
            </div>

            <ProductFilters
                filter={filter}
                onFilterChange={(next) => setFilter((current) => ({ ...current, ...next }))}
            />

            {isLoading
                ? <Loader className="h-64" />
                : (
                    <ProductTable
                        products={products ?? []}
                        onEdit={openEditForm}
                        onToggleActive={setProductToToggle}
                    />
                )}

            <ProductFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                product={editingProduct}
            />

            <AlertDialog
                open={!!productToToggle}
                onOpenChange={(open) => !open && setProductToToggle(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {productToToggle?.is_active ? "Desactivar producto" : "Reactivar producto"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {productToToggle?.is_active
                                ? `"${productToToggle?.name}" deja de ofrecerse en el punto de venta, pero sus ventas se conservan.`
                                : `"${productToToggle?.name}" vuelve a estar disponible en el punto de venta.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmToggleActive} disabled={patchProduct.isPending}>
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
