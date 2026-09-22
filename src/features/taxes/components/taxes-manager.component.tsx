"use client"

import { Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import useGetPaymentMethods from "@/features/payment/hooks/useGetPaymentMethods.hook"
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
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Switch } from "@/shared/components/ui/switch"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import formatPercentage from "@/shared/utils/formatPercentage.util"
import useDeleteTax from "../hooks/useDeleteTax.hook"
import useGetTaxes from "../hooks/useGetTaxes.hook"
import usePatchTax from "../hooks/usePatchTax.hook"
import {
    TAX_TYPE_LABELS,
    TAX_TYPES,
    usesAmount,
    type Tax,
} from "../types/tax.type"
import TaxFormDialog from "./tax-form-dialog.component"

export default function TaxesManager() {
    const { data: taxes, isLoading } = useGetTaxes()
    const { data: paymentMethods } = useGetPaymentMethods()
    const patchTax = usePatchTax()
    const deleteTax = useDeleteTax()

    const [editingTax, setEditingTax] = useState<Tax | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [taxToDelete, setTaxToDelete] = useState<Tax | null>(null)

    const openCreateForm = () => {
        setEditingTax(null)
        setIsFormOpen(true)
    }

    const openEditForm = (tax: Tax) => {
        setEditingTax(tax)
        setIsFormOpen(true)
    }

    const toggleActive = (tax: Tax, isActive: boolean) => {
        patchTax.mutate({ id: tax.id, is_active: isActive }, {
            onSuccess: () => toast.success(isActive ? "Impuesto activado" : "Impuesto desactivado"),
            onError: (error) => toast.error(error.message),
        })
    }

    const confirmDelete = () => {
        if (!taxToDelete) return

        deleteTax.mutate(taxToDelete.id, {
            onSuccess: () => {
                toast.success("Impuesto eliminado")
                setTaxToDelete(null)
            },
            onError: (error) => toast.error(error.message),
        })
    }

    const paymentMethodName = (id: number | null) =>
        (paymentMethods ?? []).find((method) => method.id === id)?.name ?? "—"

    const sorted = [...(taxes ?? [])].sort(
        (a, b) => TAX_TYPES.indexOf(a.type) - TAX_TYPES.indexOf(b.type) || a.id - b.id,
    )

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Impuestos</h1>
                    <p className="text-sm text-muted-foreground">
                        Cada impuesto entra en un paso distinto del costeo según su tipo. Sin
                        impuestos cargados, el costo es lo que pagás y el ingreso es lo que cobrás.
                    </p>
                </div>
                <Button onClick={openCreateForm}>
                    <Plus className="h-4 w-4" />
                    Nuevo impuesto
                </Button>
            </div>

            {isLoading
                ? <Loader className="h-64" />
                : sorted.length === 0
                    ? (
                        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                            Todavía no hay impuestos cargados: el costeo trabaja con los importes
                            finales, sin descontar nada.
                        </p>
                    )
                    : (
                        <div className="rounded-lg border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="text-right">Tasa o monto</TableHead>
                                        <TableHead>Detalle</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sorted.map((tax) => (
                                        <TableRow key={tax.id}>
                                            <TableCell className="font-medium">{tax.name}</TableCell>
                                            <TableCell>{TAX_TYPE_LABELS[tax.type]}</TableCell>
                                            <TableCell className="text-right">
                                                {usesAmount(tax.type)
                                                    ? formatCurrency(tax.amount)
                                                    : formatPercentage(tax.rate)}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {tax.type === "payment" && paymentMethodName(tax.payment_method_id)}
                                                {tax.type === "purchase"
                                                    && (tax.is_recoverable
                                                        ? "Se recupera como crédito fiscal"
                                                        : "Queda adentro del costo")}
                                                {tax.type === "monthly_fixed" && "Se reparte por unidad vendida"}
                                                {tax.type === "sale" && "Se descuenta del precio"}
                                                {tax.type === "profit" && "Se aplica sobre la ganancia"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={tax.is_active}
                                                        aria-label={`Activar ${tax.name}`}
                                                        onCheckedChange={(checked) => toggleActive(tax, checked)}
                                                    />
                                                    <Badge variant={tax.is_active ? "default" : "outline"}>
                                                        {tax.is_active ? "Activo" : "Inactivo"}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    <Button size="sm" variant="ghost" onClick={() => openEditForm(tax)}>
                                                        <Pencil className="h-4 w-4" />
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setTaxToDelete(tax)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

            <TaxFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} tax={editingTax} />

            <AlertDialog open={!!taxToDelete} onOpenChange={(open) => !open && setTaxToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar impuesto</AlertDialogTitle>
                        <AlertDialogDescription>
                            {taxToDelete
                                && `"${taxToDelete.name}" deja de entrar en el costeo. Si solo querés pausarlo, desactivalo en vez de borrarlo.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} disabled={deleteTax.isPending}>
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
