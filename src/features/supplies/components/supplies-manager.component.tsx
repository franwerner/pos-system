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
import usePatchSupply from "../hooks/usePatchSupply.hook"
import useGetSupplies from "../hooks/useGetSupplies.hook"
import { type Supply, type SupplyFilter } from "../types/supply.type"
import CreateProductFromSupplyDialog from "./create-product-from-supply-dialog.component"
import SupplyFilters from "./supply-filters.component"
import SupplyFormDialog from "./supply-form-dialog.component"
import SupplyTable from "./supply-table.component"

const defaultFilter: SupplyFilter = {
    search: "",
    type: "all",
    onlyActive: true,
}

export default function SuppliesManager() {
    const [filter, setFilter] = useState<SupplyFilter>(defaultFilter)
    const [editingSupply, setEditingSupply] = useState<Supply | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [supplyToToggle, setSupplyToToggle] = useState<Supply | null>(null)
    const [supplyForProduct, setSupplyForProduct] = useState<Supply | null>(null)

    const { data: supplies, isLoading } = useGetSupplies(filter)
    const patchSupply = usePatchSupply()

    const openCreateForm = () => {
        setEditingSupply(null)
        setIsFormOpen(true)
    }

    const openEditForm = (supply: Supply) => {
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

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Insumos</h1>
                    <p className="text-sm text-muted-foreground">
                        Ingredientes, packaging y bebidas: todo lo que lleva stock.
                    </p>
                </div>
                <Button onClick={openCreateForm}>
                    <Plus className="h-4 w-4" />
                    Nuevo insumo
                </Button>
            </div>

            <SupplyFilters
                filter={filter}
                onFilterChange={(next) => setFilter((current) => ({ ...current, ...next }))}
            />

            {isLoading
                ? <Loader className="h-64" />
                : (
                    <SupplyTable
                        supplies={supplies ?? []}
                        onEdit={openEditForm}
                        onToggleActive={setSupplyToToggle}
                        onCreateProduct={setSupplyForProduct}
                    />
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

            <AlertDialog
                open={!!supplyToToggle}
                onOpenChange={(open) => !open && setSupplyToToggle(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {supplyToToggle?.is_active ? "Desactivar insumo" : "Reactivar insumo"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {supplyToToggle?.is_active
                                ? `"${supplyToToggle?.name}" deja de ofrecerse para cargar, pero sus movimientos de stock se conservan.`
                                : `"${supplyToToggle?.name}" vuelve a estar disponible para cargar.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmToggleActive} disabled={patchSupply.isPending}>
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
