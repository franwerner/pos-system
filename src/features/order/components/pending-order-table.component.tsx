"use client"

import { Clock, Info, Loader2, Wallet, X } from "lucide-react"
import { Money } from "@/shared/components/money.component"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table"
import { type Order } from "../types/sale.type"

interface PendingOrderTableProps {
    orders: Order[]
    /** Ya resuelto por la vista: "1 pedido esperando el cobro." / "2 pedidos esperando el cobro." */
    countLabel: string
    onPay: (order: Order) => void
    onCancel: (order: Order) => void
}

// Cancelar no exige caja abierta (devuelve stock); Cobrar sí, pero eso se valida recién
// dentro del diálogo de cobro, no acá en la fila.
const CAJA_FOOTNOTE =
    "Para cobrar hace falta la caja abierta. Cancelar no la necesita: devuelve los insumos del pedido al stock."

const formatTime = (value: string) =>
    new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value))

const formatShortDate = (value: string) =>
    new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value))

const describeProducts = (order: Order) =>
    order.items.map((item) => `${item.product.name} × ${item.quantity}`).join(", ")

function OrdersTableHeader() {
    return (
        <TableHeader>
            <TableRow className="hover:bg-transparent">
                <TableHead className="w-[110px] px-4 text-[13px]">Pedido</TableHead>
                <TableHead className="w-[130px] px-4 text-[13px]">Tomado</TableHead>
                <TableHead className="px-4 text-[13px]">Productos</TableHead>
                <TableHead className="w-[140px] px-4 text-right text-[13px]">Subtotal</TableHead>
                <TableHead className="w-[330px] px-4 text-right text-[13px]">Acciones</TableHead>
            </TableRow>
        </TableHeader>
    )
}

/**
 * Lista de pedidos pendientes: la cantidad arriba y grande, filas altas y tocables (tablet).
 * Cobrar = botón principal; Cancelar = contorno con texto rojo, porque revierte el stock.
 */
export default function PendingOrderTable({ orders, countLabel, onPay, onCancel }: PendingOrderTableProps) {
    return (
        <>
            <div className="flex items-center gap-3.5">
                <span className="flex size-[52px] shrink-0 items-center justify-center rounded-[14px] bg-accent text-accent-foreground">
                    <Clock className="size-7" aria-hidden />
                </span>
                <div className="flex flex-col gap-0.5">
                    <p className="text-[26px] font-bold leading-tight">{countLabel}</p>
                    <p className="text-sm text-muted-foreground">
                        Ya se prepararon y descontaron stock. Se cobran con el precio que tenían al tomarlos.
                    </p>
                </div>
            </div>

            <Card className="gap-0 overflow-hidden p-0">
                <Table className="text-[15px]">
                    <OrdersTableHeader />
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id} className="hover:bg-transparent">
                                <TableCell className="px-4 py-[26px]">
                                    <span className="text-[28px] font-extrabold leading-none tabular-nums">
                                        #{order.id}
                                    </span>
                                </TableCell>
                                <TableCell className="px-4">
                                    <div className="flex flex-col">
                                        <span className="text-xl font-bold tabular-nums">
                                            {formatTime(order.created_at)}
                                        </span>
                                        <span className="text-[13px] text-muted-foreground tabular-nums">
                                            {formatShortDate(order.created_at)}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-[420px] whitespace-normal px-4">
                                    <span className="line-clamp-2 text-base leading-[1.35]">
                                        {describeProducts(order)}
                                    </span>
                                </TableCell>
                                <TableCell className="px-4 text-right">
                                    <Money value={order.sub_total} className="text-2xl" />
                                </TableCell>
                                <TableCell className="px-4">
                                    <div className="flex justify-end gap-2.5">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="h-[52px] gap-2 px-[22px] text-[17px] text-negative hover:text-negative"
                                            onClick={() => onCancel(order)}>
                                            <X className="size-5" aria-hidden />
                                            Cancelar
                                        </Button>
                                        <Button
                                            size="lg"
                                            className="h-[52px] min-w-[150px] gap-2 px-[22px] text-[17px]"
                                            onClick={() => onPay(order)}>
                                            <Wallet className="size-5" aria-hidden />
                                            Cobrar
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                <Info className="size-4 shrink-0" aria-hidden />
                {CAJA_FOOTNOTE}
            </p>
        </>
    )
}

/** Cargando: skeleton en el área de la tabla (3 filas), con el mismo header alto que la lista real. */
export function PendingOrderTableSkeleton() {
    const productWidths = ["w-[360px]", "w-[280px]", "w-[320px]"]

    return (
        <>
            <div className="flex items-center gap-3.5">
                <Skeleton className="size-[52px] rounded-[14px]" />
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-[26px] w-[320px]" />
                    <Skeleton className="h-3.5 w-[460px] max-w-full" />
                </div>
            </div>
            <Card className="gap-0 overflow-hidden p-0" aria-busy="true">
                <Table>
                    <OrdersTableHeader />
                    <TableBody>
                        {productWidths.map((width) => (
                            <TableRow key={width} className="hover:bg-transparent">
                                <TableCell className="px-4 py-[22px]"><Skeleton className="h-[26px] w-12" /></TableCell>
                                <TableCell className="px-4"><Skeleton className="h-[18px] w-16" /></TableCell>
                                <TableCell className="px-4"><Skeleton className={`h-4 max-w-full ${width}`} /></TableCell>
                                <TableCell className="px-4"><Skeleton className="ml-auto h-[22px] w-[90px]" /></TableCell>
                                <TableCell className="px-4">
                                    <div className="flex justify-end gap-2.5">
                                        <Skeleton className="h-[52px] w-[130px]" />
                                        <Skeleton className="h-[52px] w-[150px]" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Cargando pedidos pendientes…
            </p>
        </>
    )
}
