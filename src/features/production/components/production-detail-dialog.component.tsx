"use client"

import { STOCK_MOVEMENT_TYPE_LABELS } from "@/features/stock/types/stock.type"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/shared/components/ui/dialog"
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
import { type ProductionWithDetail } from "../types/production.type"

interface ProductionDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    production: ProductionWithDetail | null
}

export default function ProductionDetailDialog({
    open,
    onOpenChange,
    production,
}: ProductionDetailDialogProps) {
    const movements = [...(production?.stock_movement ?? [])]
        .sort((first, second) => first.quantity - second.quantity)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        Producción de {production?.supply?.name ?? "preparado"}
                    </DialogTitle>
                    <DialogDescription>
                        {production
                            ? `${formatDate(production.produced_at)} · ${production.quantity} ${production.supply?.unit ?? ""} · costo unitario ${formatCurrency(production.unit_cost)}`
                            : ""}
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Insumo</TableHead>
                                <TableHead>Movimiento</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                                <TableHead className="text-right">Costo unitario</TableHead>
                                <TableHead className="text-right">Importe</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {movements.map((movement) => (
                                <TableRow key={movement.id}>
                                    <TableCell className="font-medium">
                                        {movement.supply?.name ?? `Insumo #${movement.supply_id}`}
                                    </TableCell>
                                    <TableCell>{STOCK_MOVEMENT_TYPE_LABELS[movement.type]}</TableCell>
                                    <TableCell className="text-right">
                                        {movement.quantity} {movement.supply?.unit ?? ""}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(movement.unit_cost)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(Math.abs(movement.quantity) * movement.unit_cost)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {production?.note && (
                    <p className="text-sm text-muted-foreground">{production.note}</p>
                )}
            </DialogContent>
        </Dialog>
    )
}
