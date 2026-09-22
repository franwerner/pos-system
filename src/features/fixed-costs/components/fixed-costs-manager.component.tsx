"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Loader } from "@/shared/components/loader.component"
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
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import useDeleteFixedCost from "../hooks/useDeleteFixedCost.hook"
import useGetFixedCosts from "../hooks/useGetFixedCosts.hook"
import { calculateFixedCostTotal } from "../services/calculateFixedCostTotal.service"
import { currentMonth, formatPeriod, toPeriodDate } from "../services/resolvePeriod.service"
import { type FixedCost } from "../types/fixed-cost.type"
import FixedCostFormDialog from "./fixed-cost-form-dialog.component"
import FixedCostTable from "./fixed-cost-table.component"

export default function FixedCostsManager() {
    const [month, setMonth] = useState(currentMonth())
    const [editingFixedCost, setEditingFixedCost] = useState<FixedCost | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [fixedCostToDelete, setFixedCostToDelete] = useState<FixedCost | null>(null)

    const { data: fixedCosts, isLoading } = useGetFixedCosts(month)
    const deleteFixedCost = useDeleteFixedCost()

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
        })
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Costos fijos</h1>
                    <p className="text-sm text-muted-foreground">
                        Gastos mensuales del negocio. Se reparten entre los productos recién cuando
                        el mes cierra, con las unidades que se vendieron.
                    </p>
                </div>
                <Button onClick={openCreateForm}>
                    <Plus className="h-4 w-4" />
                    Nuevo costo fijo
                </Button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="fixed-cost-month">Mes</Label>
                    <Input
                        id="fixed-cost-month"
                        type="month"
                        className="w-full sm:w-48"
                        value={month}
                        onChange={(event) => event.target.value && setMonth(event.target.value)}
                    />
                </div>

                <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-sm text-muted-foreground">
                        Total de {formatPeriod(toPeriodDate(month))}
                    </p>
                    <p className="text-lg font-semibold">
                        {formatCurrency(calculateFixedCostTotal(fixedCosts ?? []))}
                    </p>
                </div>
            </div>

            {isLoading
                ? <Loader className="h-64" />
                : (
                    <FixedCostTable
                        fixedCosts={fixedCosts ?? []}
                        onEdit={openEditForm}
                        onDelete={setFixedCostToDelete}
                    />
                )}

            <FixedCostFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                fixedCost={editingFixedCost}
                defaultMonth={month}
            />

            <AlertDialog
                open={!!fixedCostToDelete}
                onOpenChange={(open) => !open && setFixedCostToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar costo fijo</AlertDialogTitle>
                        <AlertDialogDescription>
                            {`"${fixedCostToDelete?.concept}" se borra del mes y deja de sumar al total.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} disabled={deleteFixedCost.isPending}>
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
