"use client"

import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react"
import { Badge } from "@/shared/components/ui/badge"
import { Card } from "@/shared/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table"
import { EmptyState } from "@/shared/components/empty-state.component"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import { CASH_MOVEMENT_TYPE_LABELS, type CashMovement } from "../types/cash-movement.type"

const formatTime = (value: string) =>
    new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value))

const signed = (type: CashMovement["type"], amount: number) =>
    `${type === "deposit" ? "+" : "−"} ${formatCurrency(amount)}`

function MovementBadge({ type }: { type: CashMovement["type"] }) {
    return type === "deposit" ? (
        <Badge variant="secondary" className="gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium">
            <ArrowDownLeft className="size-4" aria-hidden /> {CASH_MOVEMENT_TYPE_LABELS.deposit}
        </Badge>
    ) : (
        <Badge variant="outline" className="gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium text-muted-foreground">
            <ArrowUpRight className="size-4" aria-hidden /> {CASH_MOVEMENT_TYPE_LABELS.withdrawal}
        </Badge>
    )
}

interface CashMovementTableProps {
    movements: CashMovement[]
    /** true = tabla compacta de solo lectura (detalle de una sesión cerrada), sin tarjeta ni vacío propio. */
    compact?: boolean
}

/** "Ingresos y egresos" de la caja abierta: tabla (md+), lista (celular) o vacío. */
export default function CashMovementTable({ movements, compact }: CashMovementTableProps) {
    if (compact) {
        return (
            <div className="overflow-hidden rounded-xl border border-border">
                <Table className="text-sm">
                    <TableBody>
                        {movements.map((movement) => (
                            <TableRow key={movement.id}>
                                <TableCell className="text-muted-foreground tabular-nums">{formatTime(movement.created_at)}</TableCell>
                                <TableCell><MovementBadge type={movement.type} /></TableCell>
                                <TableCell className="font-semibold">{movement.concept}</TableCell>
                                <TableCell className="text-right font-semibold tabular-nums">
                                    {signed(movement.type, movement.amount)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return (
        <Card className="gap-0 overflow-hidden p-0">
            <h2 className="px-4 pt-4 pb-1 text-lg font-bold md:px-6 md:pt-5 md:pb-3">Ingresos y egresos</h2>
            {movements.length === 0 ? (
                <div className="p-4">
                    <EmptyState
                        icon={Wallet}
                        variant="plain"
                        title="Todavía no hay ingresos ni egresos en esta caja."
                        description="Registrá acá la plata que entra o sale del cajón sin ser una venta."
                    />
                </div>
            ) : (
                <>
                    <Table className="hidden md:table">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[90px] text-[13px] font-semibold text-muted-foreground">Hora</TableHead>
                                <TableHead className="w-[140px] text-[13px] font-semibold text-muted-foreground">Tipo</TableHead>
                                <TableHead className="text-[13px] font-semibold text-muted-foreground">Concepto</TableHead>
                                <TableHead className="text-right text-[13px] font-semibold text-muted-foreground">Monto</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {movements.map((movement) => (
                                <TableRow key={movement.id}>
                                    <TableCell className="py-3 text-muted-foreground tabular-nums">
                                        {formatTime(movement.created_at)}
                                    </TableCell>
                                    <TableCell><MovementBadge type={movement.type} /></TableCell>
                                    <TableCell className="font-semibold">{movement.concept}</TableCell>
                                    <TableCell className="text-right font-semibold tabular-nums">
                                        {signed(movement.type, movement.amount)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <ul className="flex flex-col px-4 pb-1.5 md:hidden">
                        {movements.map((movement) => (
                            <li key={movement.id} className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
                                <div className="flex flex-col gap-1">
                                    <span className="font-semibold">{movement.concept}</span>
                                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <MovementBadge type={movement.type} /> {formatTime(movement.created_at)}
                                    </span>
                                </div>
                                <span className="text-[17px] font-extrabold tabular-nums">
                                    {signed(movement.type, movement.amount)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </Card>
    )
}
