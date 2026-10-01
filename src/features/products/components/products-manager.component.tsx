"use client"

import { Plus, Search } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { ConfirmDialog } from "@/shared/components/confirm-dialog.component"
import { EmptyState } from "@/shared/components/empty-state.component"
import { PageHeader } from "@/shared/components/page-header.component"
import { TableSkeleton } from "@/shared/components/table-skeleton.component"
import useGetAdminProducts from "../hooks/useGetAdminProducts.hook"
import usePatchProduct from "../hooks/usePatchProduct.hook"
import { type AdminProduct, type AdminProductFilter } from "../types/admin-product.type"
import ProductCards from "./product-cards.component"
import ProductFilters from "./product-filters.component"
import ProductFormDialog from "./product-form-dialog.component"
import ProductTable from "./product-table.component"

const defaultFilter: AdminProductFilter = {
    search: "",
    onlyActive: true,
}

/** Estado "Cargando": encabezados reales (tabla) o tarjetas de Skeleton (celular). */
function ProductsLoading() {
    return (
        <>
            <div className="hidden md:block">
                <TableSkeleton
                    headers={["Nombre", "Categoría", "Precio", "Composición", "Acciones"]}
                    widths={["w-[220px]", "w-40", "w-[90px]", "w-[110px]", "w-[120px]"]}
                />
            </div>
            <div className="flex flex-col gap-2.5 md:hidden" aria-busy="true" aria-label="Cargando">
                {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3.5">
                        <div className="flex justify-between gap-3">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-3.5 w-28" />
                    </div>
                ))}
            </div>
        </>
    )
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
            <PageHeader
                title="Productos"
                description="Lo que se vende, con la composición que descuenta stock en cada venta."
                actions={(
                    <Button size="lg" className="h-11 gap-2 md:h-12 md:px-6 md:text-base" onClick={openCreateForm}>
                        <Plus className="size-4 md:size-5" aria-hidden />
                        <span className="md:hidden">Nuevo</span>
                        <span className="hidden md:inline">Nuevo producto</span>
                    </Button>
                )}
            />

            <ProductFilters
                filter={filter}
                onFilterChange={(next) => setFilter((current) => ({ ...current, ...next }))}
            />

            {isLoading ? (
                <ProductsLoading />
            ) : (products ?? []).length === 0 ? (
                <Card className="p-5">
                    <EmptyState
                        icon={Search}
                        title="No hay productos que coincidan con el filtro."
                        description="Probá con otro nombre o apagá “Solo activos”."
                    />
                </Card>
            ) : (
                <>
                    <div className="hidden md:block">
                        <ProductTable
                            products={products ?? []}
                            onEdit={openEditForm}
                            onToggleActive={setProductToToggle}
                        />
                    </div>
                    <div className="md:hidden">
                        <ProductCards
                            products={products ?? []}
                            onEdit={openEditForm}
                            onToggleActive={setProductToToggle}
                        />
                    </div>
                </>
            )}

            <ProductFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                product={editingProduct}
            />

            <ConfirmDialog
                open={!!productToToggle}
                onOpenChange={(open) => !open && setProductToToggle(null)}
                onConfirm={confirmToggleActive}
                title={productToToggle?.is_active ? "Desactivar producto" : "Reactivar producto"}
                description={
                    productToToggle?.is_active
                        ? `"${productToToggle?.name}" deja de aparecer en el punto de venta. Las ventas ya hechas se conservan y podés reactivarlo cuando quieras.`
                        : `"${productToToggle?.name}" vuelve a aparecer en el punto de venta.`
                }
                confirmLabel={productToToggle?.is_active ? "Desactivar" : "Reactivar"}
                pending={patchProduct.isPending}
            />
        </div>
    )
}
