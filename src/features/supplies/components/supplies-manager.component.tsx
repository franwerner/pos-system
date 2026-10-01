"use client"

import { Package, Plus, Search } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { ConfirmDialog } from "@/shared/components/confirm-dialog.component"
import { EmptyState } from "@/shared/components/empty-state.component"
import { PageHeader } from "@/shared/components/page-header.component"
import { TableSkeleton } from "@/shared/components/table-skeleton.component"
import usePatchSupply from "../hooks/usePatchSupply.hook"
import useGetSupplies from "../hooks/useGetSupplies.hook"
import { type SupplyFilter, type SupplyWithCost } from "../types/supply.type"
import CreateProductFromSupplyDialog from "./create-product-from-supply-dialog.component"
import SupplyCards from "./supply-cards.component"
import SupplyFilters from "./supply-filters.component"
import SupplyFormDialog from "./supply-form-dialog.component"
import SupplyTable from "./supply-table.component"

const defaultFilter: SupplyFilter = {
    search: "",
    type: "all",
    onlyActive: true,
}

const isDefaultFilter = (filter: SupplyFilter) =>
    filter.search === "" && filter.type === "all" && filter.onlyActive

/** Estado "Cargando": encabezados reales (tabla) o tarjetas de Skeleton (celular). */
function SuppliesLoading() {
    return (
        <>
            <div className="hidden md:block">
                <TableSkeleton
                    headers={["Nombre", "Tipo", "Unidad", "Precio de compra", "Rendimiento", "Stock mínimo", "Acciones"]}
                    widths={["w-[180px]", "w-16", "w-[110px]", "w-16", "w-12", "w-14", "w-[220px]"]}
                />
            </div>
            <div className="flex flex-col gap-4 md:hidden" aria-busy="true" aria-label="Cargando">
                {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-3.5">
                        <Skeleton className="h-4 w-3/5" />
                        <Skeleton className="h-3 w-2/5" />
                        <Skeleton className="h-9 w-[70%]" />
                    </div>
                ))}
            </div>
        </>
    )
}

export default function SuppliesManager() {
    const [filter, setFilter] = useState<SupplyFilter>(defaultFilter)
    const [editingSupply, setEditingSupply] = useState<SupplyWithCost | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [supplyToToggle, setSupplyToToggle] = useState<SupplyWithCost | null>(null)
    const [supplyForProduct, setSupplyForProduct] = useState<SupplyWithCost | null>(null)

    const { data: supplies, isLoading } = useGetSupplies(filter)
    const patchSupply = usePatchSupply()

    const openCreateForm = () => {
        setEditingSupply(null)
        setIsFormOpen(true)
    }

    const openEditForm = (supply: SupplyWithCost) => {
        setEditingSupply(supply)
        setIsFormOpen(true)
    }

    const confirmToggleActive = () => {
        if (!supplyToToggle) return

        const isActive = !supplyToToggle.is_active

        patchSupply.mutate({ id: supplyToToggle.id, values: { is_active: isActive } }, {
            onSuccess: () => {
                toast.success(isActive ? "Insumo reactivado" : "Insumo desactivado")
                setSupplyToToggle(null)
            },
        })
    }

    // Distingue "todavía no hay ningún insumo" (primer uso) de "el filtro no encuentra
    // nada": son dos avisos distintos en el diseño y solo el primero ofrece un atajo para
    // crear el primer insumo.
    const isTrulyEmpty = (supplies ?? []).length === 0 && isDefaultFilter(filter)

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Insumos"
                description="Ingredientes, packaging y bebidas: todo lo que lleva stock."
                actions={(
                    <Button size="lg" className="h-11 gap-2 md:h-12 md:px-6 md:text-base" onClick={openCreateForm}>
                        <Plus className="size-4 md:size-5" aria-hidden />
                        <span className="md:hidden">Nuevo</span>
                        <span className="hidden md:inline">Nuevo insumo</span>
                    </Button>
                )}
            />

            <SupplyFilters
                filter={filter}
                onFilterChange={(next) => setFilter((current) => ({ ...current, ...next }))}
            />

            {isLoading ? (
                <SuppliesLoading />
            ) : (supplies ?? []).length === 0 ? (
                <Card className="p-5">
                    {isTrulyEmpty ? (
                        <EmptyState
                            icon={Package}
                            title="Todavía no hay insumos cargados."
                            description="Los insumos son la base de las recetas: empezá por lo que más usás."
                            action={(
                                <Button className="gap-2" onClick={openCreateForm}>
                                    <Plus className="size-4" aria-hidden /> Nuevo insumo
                                </Button>
                            )}
                        />
                    ) : (
                        <EmptyState
                            icon={Search}
                            title="No hay insumos que coincidan con el filtro."
                            description="Probá con otro nombre, otro tipo o apagá “Solo activos”."
                        />
                    )}
                </Card>
            ) : (
                <>
                    <SupplyTable
                        supplies={supplies ?? []}
                        onEdit={openEditForm}
                        onToggleActive={setSupplyToToggle}
                        onCreateProduct={setSupplyForProduct}
                    />
                    <SupplyCards
                        supplies={supplies ?? []}
                        onEdit={openEditForm}
                        onToggleActive={setSupplyToToggle}
                        onCreateProduct={setSupplyForProduct}
                    />
                </>
            )}

            <SupplyFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                supply={editingSupply}
            />

            <CreateProductFromSupplyDialog
                open={!!supplyForProduct}
                onOpenChange={(open) => !open && setSupplyForProduct(null)}
                supply={supplyForProduct}
            />

            <ConfirmDialog
                open={!!supplyToToggle}
                onOpenChange={(open) => !open && setSupplyToToggle(null)}
                onConfirm={confirmToggleActive}
                title={supplyToToggle?.is_active ? "Desactivar insumo" : "Reactivar insumo"}
                description={
                    supplyToToggle?.is_active
                        ? `"${supplyToToggle?.name}" deja de aparecer para cargar recetas y compras. Los movimientos de stock ya hechos se conservan y podés reactivarlo cuando quieras.`
                        : `"${supplyToToggle?.name}" vuelve a estar disponible para recetas, compras y producción.`
                }
                confirmLabel={supplyToToggle?.is_active ? "Desactivar" : "Reactivar"}
                pending={patchSupply.isPending}
            />
        </div>
    )
}
