"use client"

import { Pencil, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Loader } from "@/shared/components/loader.component"
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
import useGetPaymentMethods from "../hooks/useGetPaymentMethods.hook"
import usePatchPaymentMethod from "../hooks/usePatchPaymentMethod.hook"
import { formatAdjustmentPercentage } from "../services/describeAdjustment.service"
import { type Payment } from "../types/payment.type"
import PaymentMethodFormDialog from "./payment-method-form-dialog.component"

export default function PaymentMethodsManager() {
    const { data: paymentMethods, isLoading } = useGetPaymentMethods()
    const patchPaymentMethod = usePatchPaymentMethod()

    const [editingPaymentMethod, setEditingPaymentMethod] = useState<Payment | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)

    const openCreateForm = () => {
        setEditingPaymentMethod(null)
        setIsFormOpen(true)
    }

    const openEditForm = (paymentMethod: Payment) => {
        setEditingPaymentMethod(paymentMethod)
        setIsFormOpen(true)
    }

    const toggleActive = (paymentMethod: Payment, isActive: boolean) => {
        patchPaymentMethod.mutate({ id: paymentMethod.id, is_active: isActive }, {
            onSuccess: () => toast.success(isActive ? "Tarifa activada" : "Tarifa desactivada"),
            onError: (error) => toast.error(error.message),
        })
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Tarifas</h1>
                    <p className="text-sm text-muted-foreground">
                        Métodos de pago y el ajuste que aplica cada uno sobre la parte que cobra:
                        negativo descuenta (-10 = 10% menos por efectivo), positivo recarga y 0 cobra
                        el precio de lista.
                    </p>
                </div>
                <Button onClick={openCreateForm}>
                    <Plus className="h-4 w-4" />
                    Nueva tarifa
                </Button>
            </div>

            {isLoading
                ? <Loader className="h-64" />
                : (paymentMethods ?? []).length === 0
                    ? (
                        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                            Todavía no hay tarifas cargadas.
                        </p>
                    )
                    : (
                        <div className="rounded-lg border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead className="text-right">Ajuste</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(paymentMethods ?? []).map((paymentMethod) => (
                                        <TableRow key={paymentMethod.id}>
                                            <TableCell className="font-medium">{paymentMethod.name}</TableCell>
                                            <TableCell className="text-right">
                                                {formatAdjustmentPercentage(paymentMethod.tax)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={paymentMethod.is_active}
                                                        aria-label={`Activar ${paymentMethod.name}`}
                                                        onCheckedChange={(checked) =>
                                                            toggleActive(paymentMethod, checked)}
                                                    />
                                                    <Badge variant={paymentMethod.is_active ? "default" : "outline"}>
                                                        {paymentMethod.is_active ? "Activa" : "Inactiva"}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => openEditForm(paymentMethod)}>
                                                    <Pencil className="h-4 w-4" />
                                                    Editar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

            <PaymentMethodFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                paymentMethod={editingPaymentMethod}
            />
        </div>
    )
}
