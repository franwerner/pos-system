"use client"

import { History, SlidersHorizontal } from "lucide-react"
import { SUPPLY_UNIT_LABELS } from "@/features/supplies/types/supply.type"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table"
import { cn } from "@/shared/utils/cn.util"
import { isBelowMinimum, isNegativeStock } from "../services/calculateStock.service"
import { type SupplyStock } from "../types/stock.type"

interface StockTableProps {
    rows: SupplyStock[]
    onShowHistory: (row: SupplyStock) => void
    onRegisterMovement: (row: SupplyStock) => void
}

export default function StockTable({ rows, onShowHistory, onRegisterMovement }: StockTableProps) {
    if (rows.length === 0) {
        return (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                No hay insumos que coincidan con el filtro.
            </p>
        )
    }

    return (
        <div className="rounded-lg border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Insumo</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead className="text-right">Stock actual</TableHead>
                        <TableHead className="text-right">Stock mínimo</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => {
                        const isLow = isBelowMinimum(row.current_stock, row.min_stock)
                        const isNegative = isNegativeStock(row.current_stock)

                        return (
                            <TableRow key={row.supply_id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        {row.name}
                                        {isNegative && <Badge variant="destructive">Negativo</Badge>}
                                        {isLow && !isNegative && <Badge variant="destructive">Bajo mínimo</Badge>}
                                    </div>
                                </TableCell>
                                <TableCell>{SUPPLY_UNIT_LABELS[row.unit]}</TableCell>
                                <TableCell
                                    className={cn(
                                        "text-right font-medium",
                                        isLow && "text-destructive",
                                        isNegative && "font-bold text-destructive",
                                    )}>
                                    {row.current_stock}
                                </TableCell>
                                <TableCell className="text-right">{row.min_stock}</TableCell>
                                <TableCell>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onShowHistory(row)}>
                                            <History className="h-4 w-4" />
                                            Movimientos
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => onRegisterMovement(row)}>
                                            <SlidersHorizontal className="h-4 w-4" />
                                            Pérdida o ajuste
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
