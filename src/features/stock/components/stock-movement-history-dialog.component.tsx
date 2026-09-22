"use client"

import { Loader } from "@/shared/components/loader.component"
import { Badge } from "@/shared/components/ui/badge"
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
import { cn } from "@/shared/utils/cn.util"
import formatDate from "@/shared/utils/formatDate.util"
import useGetStockMovements from "../hooks/useGetStockMovements.hook"
import { sumStockMovements } from "../services/calculateStock.service"
import {
    STOCK_MOVEMENT_TYPE_LABELS,
    type StockMovement,
    type SupplyStock,
} from "../types/stock.type"

const describeOrigin = (movement: StockMovement): string => {
    if (movement.purchase_id) return `Compra #${movement.purchase_id}`
    if (movement.sale_id) return `Venta #${movement.sale_id}`
    if (movement.production_id) return `Producción #${movement.production_id}`
    return "Carga manual"
}

interface StockMovementHistoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    supplyStock: SupplyStock | null
}

export default function StockMovementHistoryDialog({
    open,
    onOpenChange,
    supplyStock,
}: StockMovementHistoryDialogProps) {
    const { data: movements, isLoading } = useGetStockMovements(
        open && supplyStock ? supplyStock.supply_id : null,
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Movimientos de {supplyStock?.name}</DialogTitle>
                    <DialogDescription>
                        El stock actual es la suma de estos movimientos:{" "}
                        {sumStockMovements(movements ?? [])} {supplyStock?.unit}.
                    </DialogDescription>
                </DialogHeader>

                {isLoading
                    ? <Loader className="h-48" />
                    : (movements ?? []).length === 0
                        ? (
                            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                                Este insumo todavía no tiene movimientos.
                            </p>
                        )
                        : (
                            <div className="max-h-96 overflow-y-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead className="text-right">Cantidad</TableHead>
                                            <TableHead>Origen</TableHead>
                                            <TableHead>Nota</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(movements ?? []).map((movement) => (
                                            <TableRow key={movement.id}>
                                                <TableCell className="whitespace-nowrap">
                                                    {formatDate(movement.created_at)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {STOCK_MOVEMENT_TYPE_LABELS[movement.type]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell
                                                    className={cn(
                                                        "text-right font-medium",
                                                        movement.quantity < 0 ? "text-destructive" : "text-primary",
                                                    )}>
                                                    {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                                                </TableCell>
                                                <TableCell>{describeOrigin(movement)}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {movement.note ?? "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
            </DialogContent>
        </Dialog>
    )
}
