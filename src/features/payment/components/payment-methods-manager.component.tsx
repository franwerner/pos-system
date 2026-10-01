"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/shared/components/ui/button"
import { PageHeader } from "@/shared/components/page-header.component"
import useGetPaymentMethods from "../hooks/useGetPaymentMethods.hook"
import usePatchPaymentMethod from "../hooks/usePatchPaymentMethod.hook"
import { type Payment } from "../types/payment.type"
import PaymentMethodFormDialog from "./payment-method-form-dialog.component"
import PaymentMethodTable from "./payment-method-table.component"

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

    // Sin confirmación: así lo pide el brief (Design/pantallas/admin-payment-methods.md,
    // "Qué NO debe tener" no la pide y el README del export lo marca explícito).
    const toggleActive = (paymentMethod: Payment, isActive: boolean) => {
        patchPaymentMethod.mutate({ id: paymentMethod.id, is_active: isActive }, {
            onSuccess: () => toast.success(isActive ? "Tarifa activada" : "Tarifa desactivada"),
            onError: (error) => toast.error(error.message),
        })
    }

    // Deshabilita el switch solo de la fila en vuelo, no toda la tabla.
    const togglingId =
        patchPaymentMethod.isPending && patchPaymentMethod.variables
            ? patchPaymentMethod.variables.id
            : null

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Tarifas"
                description="Métodos de pago y el recargo o descuento al cliente que aplica cada uno: negativo descuenta (-10 = 10% menos por efectivo), positivo recarga y 0 cobra el precio de lista."
                actions={
                    <Button size="lg" className="h-11 gap-2 md:h-10" onClick={openCreateForm}>
                        <Plus className="size-5" aria-hidden />
                        <span className="md:hidden">Nueva</span>
                        <span className="hidden md:inline">Nueva tarifa</span>
                    </Button>
                }
            />

            <PaymentMethodTable
                paymentMethods={paymentMethods ?? []}
                isLoading={isLoading}
                togglingId={togglingId}
                onEdit={openEditForm}
                onToggleActive={toggleActive}
                onCreate={openCreateForm}
            />

            <PaymentMethodFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                paymentMethod={editingPaymentMethod}
            />
        </div>
    )
}
