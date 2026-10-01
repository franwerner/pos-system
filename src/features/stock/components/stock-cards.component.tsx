"use client"

import { Clock, Minus } from "lucide-react"
import { SUPPLY_UNIT_LABELS } from "@/features/supplies/types/supply.type"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/utils/cn.util"
import { resolveStockStatus } from "../services/calculateStock.service"
import { type SupplyStock } from "../types/stock.type"
import { CurrentStock, StockBadge, formatQuantity } from "./stock-table.component"

interface StockCardsProps {
    rows: SupplyStock[]
    onShowHistory: (row: SupplyStock) => void
    onRegisterMovement: (row: SupplyStock) => void
}

/**
 * Versión celular de la fila. Local en vez de `RecordCard` compartido: el diseño pone el
 * badge debajo del nombre y los dos botones en una fila propia, porque badge + acciones no
 * entran en una sola fila a 390px (mismo motivo documentado en
 * `Design/export/10-admin-stock/README.md`, sección Responsive).
 */
function StockCard({
    row,
    onShowHistory,
    onRegisterMovement,
}: {
    row: SupplyStock
    onShowHistory: (row: SupplyStock) => void
    onRegisterMovement: (row: SupplyStock) => void
}) {
    const status = resolveStockStatus(row.current_stock, row.min_stock)

    return (
        <div
            className={cn(
                "flex flex-col gap-2 rounded-[14px] border border-border bg-card p-3.5",
                status === "low" && "border-negative/45",
                status === "negative" && "border-negative",
            )}
        >
            <div className="flex items-start justify-between gap-2.5">
                <div className="flex min-w-0 flex-col items-start gap-1">
                    <span className="text-base font-semibold">{row.name}</span>
                    <StockBadge status={status} />
                </div>
                <div className="flex shrink-0 flex-col items-end">
                    <CurrentStock
                        status={status}
                        currentStock={row.current_stock}
                        className={status === "negative" ? "text-[23px]" : "text-[22px]"}
                    />
                    <span className="text-[13px] text-muted-foreground">
                        {SUPPLY_UNIT_LABELS[row.unit]} · mínimo {formatQuantity(row.min_stock)}
                    </span>
                </div>
            </div>
            <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-10 flex-1 gap-1.5" onClick={() => onShowHistory(row)}>
                    <Clock className="size-4" aria-hidden /> Movimientos
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-10 flex-1 gap-1.5"
                    onClick={() => onRegisterMovement(row)}
                >
                    <Minus className="size-4" aria-hidden /> Pérdida o ajuste
                </Button>
            </div>
        </div>
    )
}

/** Celular (< md): una `StockCard` por insumo, con la tabla oculta en su lugar. */
export default function StockCards({ rows, onShowHistory, onRegisterMovement }: StockCardsProps) {
    return (
        <div className="flex flex-col gap-4 md:hidden">
            {rows.map((row) => (
                <StockCard
                    key={row.supply_id}
                    row={row}
                    onShowHistory={onShowHistory}
                    onRegisterMovement={onRegisterMovement}
                />
            ))}
        </div>
    )
}
