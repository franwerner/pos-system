"use client"

import { ArrowLeft, CircleCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import useGetOpenCashSession from "@/features/cash/hooks/useGetOpenCashSession.hook"
import PayOrderDialog from "@/features/order/components/pay-order-dialog.component"
import PendingOrderTable, {
    PendingOrderTableSkeleton,
} from "@/features/order/components/pending-order-table.component"
import useCancelOrder from "@/features/order/hooks/useCancelOrder.hook"
import useGetOrders from "@/features/order/hooks/useGetOrders.hook"
import { type Order } from "@/features/order/types/sale.type"
import { CajaBadge } from "@/shared/components/caja-indicator.component"
import { ConfirmDialog } from "@/shared/components/confirm-dialog.component"
import { EmptyState } from "@/shared/components/empty-state.component"
import Linker from "@/shared/components/linker.component"
import { PosPageHeader } from "@/shared/components/pos-header.component"
import { Button } from "@/shared/components/ui/button"

export default function PendingOrdersView() {
    const router = useRouter()
    const { data: orders, isLoading } = useGetOrders("pending")
    const { data: cashSession } = useGetOpenCashSession()
    const cancelOrder = useCancelOrder()

    const [orderToPay, setOrderToPay] = useState<Order | null>(null)
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)

    const pendingOrders = orders ?? []
    const countLabel = `${pendingOrders.length} pedido${pendingOrders.length === 1 ? "" : "s"} esperando el cobro.`

    const confirmCancel = () => {
        if (!orderToCancel) return

        cancelOrder.mutate(orderToCancel.id, {
            onSuccess: (cancelled) => {
                toast.success(`Pedido #${cancelled.id} cancelado: el stock volvió a como estaba`)
                setOrderToCancel(null)
            },
            onError: (error) => toast.error(error.message),
        })
    }

    return (
        <div className="flex min-h-dvh flex-col bg-background text-foreground">
            <PosPageHeader
                title="Pedidos pendientes"
                right={<CajaBadge open={!!cashSession} initialAmount={cashSession?.opening_amount} />}
            />

            <main className="flex flex-1 flex-col gap-5 px-7 py-6">
                {isLoading ? (
                    <PendingOrderTableSkeleton />
                ) : pendingOrders.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                        <EmptyState
                            variant="plain"
                            tone="success"
                            size="lg"
                            icon={CircleCheck}
                            title="Todo cobrado: no queda ningún pedido abierto."
                            description="Los pedidos que dejes pendientes al cerrar una venta van a aparecer acá."
                            action={
                                <Button asChild className="mt-1 h-16 gap-2 rounded-[14px] px-7 text-xl font-extrabold">
                                    <Linker href="/pos">
                                        <ArrowLeft className="size-6" aria-hidden />
                                        Volver a vender
                                    </Linker>
                                </Button>
                            }
                        />
                    </div>
                ) : (
                    <PendingOrderTable
                        orders={pendingOrders}
                        countLabel={countLabel}
                        onPay={setOrderToPay}
                        onCancel={setOrderToCancel}
                    />
                )}
            </main>

            <PayOrderDialog
                order={orderToPay}
                onOpenChange={(open) => !open && setOrderToPay(null)}
                onPaid={(order) => router.push(`/pos/order/${order.id}`)}
            />

            <ConfirmDialog
                open={!!orderToCancel}
                onOpenChange={(open) => !open && setOrderToCancel(null)}
                onConfirm={confirmCancel}
                title={`Cancelar el pedido #${orderToCancel?.id}`}
                description="El pedido queda cancelado y los insumos que había descontado vuelven al stock."
                confirmLabel="Confirmar"
                destructive
                pending={cancelOrder.isPending}
                pendingLabel="Cancelando..."
            />
        </div>
    )
}
