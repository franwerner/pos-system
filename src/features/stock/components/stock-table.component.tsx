"use client"

import { Clock, Minus } from "lucide-react"
import { SUPPLY_UNIT_LABELS } from "@/features/supplies/types/supply.type"
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
import { RowActions } from "@/shared/components/row-actions.component"
import { cn } from "@/shared/utils/cn.util"
import { resolveStockStatus } from "../services/calculateStock.service"
import { type StockStatus, type SupplyStock } from "../types/stock.type"

interface StockTableProps {
    rows: SupplyStock[]
    onShowHistory: (row: SupplyStock) => void
    onRegisterMovement: (row: SupplyStock) => void
}

// Cantidades de stock no son moneda: mismo criterio que `supply-table.component.tsx`
// (`formatQuantity`), un solo número no amerita un util nuevo en `shared/utils`.
export const formatQuantity = (value: number) => new Intl.NumberFormat("es-AR").format(value)

/** "Negativo" (rojo sólido, prioridad) o "Bajo mínimo" (rojo suave). Mutuamente excluyentes. */
export function StockBadge({ status }: { status: StockStatus }) {
    if (status === "ok") return null

    return status === "negative" ? (
        <Badge className="rounded-full bg-destructive px-2.5 font-semibold text-destructive-foreground">
            Negativo
        </Badge>
    ) : (
        <Badge
            variant="secondary"
            className="rounded-full bg-destructive-muted px-2.5 font-semibold text-destructive-muted-foreground"
        >
            Bajo mínimo
        </Badge>
    )
}

/** Stock actual: protagonista de la fila/tarjeta. Rojo si está bajo el mínimo, más pesado si es negativo. */
export function CurrentStock({
    status,
    currentStock,
    className,
}: {
    status: StockStatus
    currentStock: number
    className?: string
}) {
    return (
        <span
            className={cn(
                "font-bold tabular-nums",
                status !== "ok" && "text-negative",
                status === "negative" && "font-extrabold",
                className,
            )}
        >
            {formatQuantity(currentStock)}
        </span>
    )
}

/** Tabla de escritorio (md+): la versión celular es `StockCards`. */
export default function StockTable({ rows, onShowHistory, onRegisterMovement }: StockTableProps) {
    return (
        <Card className="hidden overflow-hidden p-0 md:block">
            <Table className="text-[15px]">
                <TableHeader>
                    <TableRow>
                        <TableHead className="px-4 text-[13px] font-semibold text-muted-foreground">Insumo</TableHead>
                        <TableHead className="px-4 text-[13px] font-semibold text-muted-foreground">Unidad</TableHead>
                        <TableHead className="px-4 text-right text-[13px] font-semibold text-muted-foreground">
                            Stock actual
                        </TableHead>
                        <TableHead className="px-4 text-right text-[13px] font-semibold text-muted-foreground">
                            Stock mínimo
                        </TableHead>
                        <TableHead className="px-4 text-right text-[13px] font-semibold text-muted-foreground">
                            Acciones
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => {
                        const status = resolveStockStatus(row.current_stock, row.min_stock)

                        return (
                            <TableRow
                                key={row.supply_id}
                                className={cn(status !== "ok" && "bg-destructive-muted/55 hover:bg-destructive-muted/70")}
                            >
                                <TableCell className="px-4 py-3">
                                    <span className="flex items-center gap-2 whitespace-nowrap">
                                        <span className="font-semibold">{row.name}</span>
                                        <StockBadge status={status} />
                                    </span>
                                </TableCell>
                                <TableCell className="px-4 py-3">{SUPPLY_UNIT_LABELS[row.unit]}</TableCell>
                                <TableCell className="px-4 py-3 text-right">
                                    <CurrentStock
                                        status={status}
                                        currentStock={row.current_stock}
                                        className={status === "negative" ? "text-lg" : "text-[17px]"}
                                    />
                                </TableCell>
                                <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                    {formatQuantity(row.min_stock)}
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <RowActions
                                        actions={[
                                            { label: "Movimientos", icon: Clock, onClick: () => onShowHistory(row) },
                                            { label: "Pérdida o ajuste", icon: Minus, onClick: () => onRegisterMovement(row) },
                                        ]}
                                        className="gap-0.5"
                                    />
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </Card>
    )
}
