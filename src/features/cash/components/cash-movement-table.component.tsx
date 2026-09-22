"use client"

import { Badge } from "@/shared/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import formatDate from "@/shared/utils/formatDate.util"
import { CASH_MOVEMENT_TYPE_LABELS, type CashMovement } from "../types/cash-movement.type"

interface CashMovementTableProps {
    movements: CashMovement[]
}

export default function CashMovementTable({ movements }: CashMovementTableProps) {
    if (movements.length === 0) {
        return (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Esta caja no tiene ingresos ni egresos registrados.
            </p>
        )
    }

    return (
        <div className="rounded-lg border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {movements.map((movement) => (
                        <TableRow key={movement.id}>
                            <TableCell>
                                <Badge variant={movement.type === "deposit" ? "secondary" : "destructive"}>
                                    {CASH_MOVEMENT_TYPE_LABELS[movement.type]}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{movement.concept}</TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                                {formatDate(movement.created_at)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {movement.type === "deposit" ? "+" : "−"} {formatCurrency(movement.amount)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
