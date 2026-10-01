"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/shared/components/ui/button"
import { ConfirmDialog } from "@/shared/components/confirm-dialog.component"
import { MonthPicker } from "@/shared/components/month-picker.component"
import { PageHeader } from "@/shared/components/page-header.component"
import useDeleteFixedCost from "../hooks/useDeleteFixedCost.hook"
import useGetFixedCosts from "../hooks/useGetFixedCosts.hook"
import { calculateFixedCostTotal } from "../services/calculateFixedCostTotal.service"
import { currentMonth, formatPeriod, toPeriodDate } from "../services/resolvePeriod.service"
import { type FixedCost } from "../types/fixed-cost.type"
import FixedCostFormDialog from "./fixed-cost-form-dialog.component"
import FixedCostTable from "./fixed-cost-table.component"
import RequiredSales from "./required-sales.component"

/**
 * Orden deliberado (PLAN-UI/vistas/admin-fixed-costs.md): 1) bloque "Necesitás
 * vender" (responde la pregunta de toda la pantalla) · 2) encabezado · 3) mes +
 * total · 4) tabla de costos fijos (soporte, no protagonista).
 */
export default function FixedCostsManager() {
    const [month, setMonth] = useState(currentMonth())
    const [editingFixedCost, setEditingFixedCost] = useState<FixedCost | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [fixedCostToDelete, setFixedCostToDelete] = useState<FixedCost | null>(null)

    const { data: fixedCosts, isLoading } = useGetFixedCosts(month)
    const deleteFixedCost = useDeleteFixedCost()
    const monthTotal = calculateFixedCostTotal(fixedCosts ?? [])

    const openCreateForm = () => {
        setEditingFixedCost(null)
        setIsFormOpen(true)
    }

    const openEditForm = (fixedCost: FixedCost) => {
        setEditingFixedCost(fixedCost)
        setIsFormOpen(true)
    }

    const confirmDelete = () => {
        if (!fixedCostToDelete) return

        deleteFixedCost.mutate(fixedCostToDelete.id, {
            onSuccess: () => {
                toast.success("Costo fijo eliminado")
                setFixedCostToDelete(null)
            },
            onError: (error) => toast.error(error.message),
        })
    }

    return (
        <div className="flex flex-col gap-6">
            <RequiredSales fixedCostTotal={monthTotal} month={month} />

            <PageHeader
                title="Costos fijos"
                description="Gastos mensuales del negocio. De acá sale cuánto necesitás vender para cubrirlos."
                actions={
                    <Button size="lg" className="h-11 gap-2 md:h-12 md:px-5 md:text-base" onClick={openCreateForm}>
                        <Plus className="size-5" aria-hidden />
                        <span className="md:hidden">Nuevo</span>
                        <span className="hidden md:inline">Nuevo costo fijo</span>
                    </Button>
                }
            />

            <MonthPicker
                value={month}
                onChange={setMonth}
                totalLabel={`Total de ${formatPeriod(toPeriodDate(month))}`}
                total={monthTotal}
            />

            <FixedCostTable
                fixedCosts={fixedCosts ?? []}
                isLoading={isLoading}
                onEdit={openEditForm}
                onDelete={setFixedCostToDelete}
            />

            <FixedCostFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                fixedCost={editingFixedCost}
                defaultMonth={month}
            />

            <ConfirmDialog
                open={!!fixedCostToDelete}
                onOpenChange={(open) => !open && setFixedCostToDelete(null)}
                onConfirm={confirmDelete}
                title="Eliminar costo fijo"
                description={`"${fixedCostToDelete?.concept}" se borra del mes y deja de sumar al total.`}
                confirmLabel="Confirmar"
                destructive
                pending={deleteFixedCost.isPending}
                pendingLabel="Eliminando…"
            />
        </div>
    )
}
