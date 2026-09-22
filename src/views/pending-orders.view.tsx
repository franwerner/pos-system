"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import PayOrderDialog from "@/features/order/components/pay-order-dialog.component"
import PendingOrderTable from "@/features/order/components/pending-order-table.component"
import useCancelOrder from "@/features/order/hooks/useCancelOrder.hook"
import useGetOrders from "@/features/order/hooks/useGetOrders.hook"
import { type Order } from "@/features/order/types/sale.type"
import Linker from "@/shared/components/linker.component"
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

export default function PendingOrdersView() {
    const router = useRouter()
    const { data: orders, isLoading } = useGetOrders("pending")
    const cancelOrder = useCancelOrder()

    const [orderToPay, setOrderToPay] = useState<Order | null>(null)
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)

    const pendingOrders = orders ?? []

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
        <div className="container mx-auto flex flex-col gap-6 p-4 py-10 max-w-5xl">
            <Button asChild variant="ghost" className="w-fit">
                <Linker href="/pos">
                    <div className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Volver al inicio
                    </div>
                </Linker>
            </Button>

            <div>
                <h1 className="text-3xl font-bold text-gray-900">Pedidos pendientes</h1>
                <p className="text-sm text-muted-foreground">
                    {pendingOrders.length === 0
                        ? "Todo cobrado: no queda ningún pedido abierto."
                        : `${pendingOrders.length} pedido${pendingOrders.length === 1 ? "" : "s"} esperando el cobro.`}
                </p>
            </div>

            {isLoading
                ? <Loader className="h-64" />
                : (
                    <PendingOrderTable
                        orders={pendingOrders}
                        onPay={setOrderToPay}
                        onCancel={setOrderToCancel}
                    />
                )}

            <PayOrderDialog
                order={orderToPay}
                onOpenChange={(open) => !open && setOrderToPay(null)}
                onPaid={(order) => router.push(`/pos/order/${order.id}`)}
            />

            <AlertDialog
                open={!!orderToCancel}
                onOpenChange={(open) => !open && setOrderToCancel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar el pedido #{orderToCancel?.id}</AlertDialogTitle>
                        <AlertDialogDescription>
                            El pedido queda cancelado y los insumos que había descontado vuelven al stock.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCancel} disabled={cancelOrder.isPending}>
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
