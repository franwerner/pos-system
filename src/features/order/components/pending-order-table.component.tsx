"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table"
import { Button } from "@/shared/components/ui/button"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import formatDate from "@/shared/utils/formatDate.util"
import { type Order } from "../types/sale.type"

interface PendingOrderTableProps {
    orders: Order[]
    onPay: (order: Order) => void
    onCancel: (order: Order) => void
}

export default function PendingOrderTable({ orders, onPay, onCancel }: PendingOrderTableProps) {
    if (orders.length === 0) {
        return (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                No hay pedidos pendientes de cobro.
            </p>
        )
    }

    return (
        <div className="rounded-lg border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Tomado</TableHead>
                        <TableHead>Productos</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id}</TableCell>
                            <TableCell className="whitespace-nowrap">
                                {formatDate(order.created_at)}
                            </TableCell>
                            <TableCell className="max-w-xs">
                                <span className="line-clamp-2 text-sm text-muted-foreground">
                                    {order.items
                                        .map((item) => `${item.product.name} × ${item.quantity}`)
                                        .join(", ")}
                                </span>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {formatCurrency(order.sub_total)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" onClick={() => onPay(order)}>Cobrar</Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onCancel(order)}>
                                        Cancelar
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
