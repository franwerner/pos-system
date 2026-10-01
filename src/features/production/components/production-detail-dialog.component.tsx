"use client"

import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { Card } from "@/shared/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table"
import { Button } from "@/shared/components/ui/button"
import { DialogShell } from "@/shared/components/dialog-shell.component"
import { Money } from "@/shared/components/money.component"
import { STOCK_MOVEMENT_TYPE_LABELS } from "@/features/stock/types/stock.type"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import formatDate from "@/shared/utils/formatDate.util"
import { cn } from "@/shared/utils/cn.util"
import { type ProductionMovement, type ProductionWithDetail } from "../types/production.type"

// Cantidades no son moneda: mismo criterio que el resto del admin (`formatQuantity`
// en `stock-table.component.tsx` / `production-components-preview.component.tsx`).
const formatQuantity = (value: number) => new Intl.NumberFormat("es-AR").format(Math.abs(value))

const isIngreso = (movement: ProductionMovement) => movement.quantity > 0

function MovementBadge({ ingreso }: { ingreso: boolean }) {
    const Icon = ingreso ? ArrowUpRight : ArrowDownLeft

    return (
        <span
            className={cn(
                "inline-flex h-[22px] items-center gap-1 rounded-full border px-2 text-xs font-semibold",
                ingreso
                    ? "border-transparent bg-success-muted text-success-muted-foreground"
                    : "border-border text-muted-foreground",
            )}
        >
            <Icon className="size-4" aria-hidden />
            {STOCK_MOVEMENT_TYPE_LABELS[ingreso ? "production_in" : "production_out"]}
        </span>
    )
}

interface ProductionDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    production: ProductionWithDetail | null
}

/** Detalle de una producción: los movimientos de stock que generó. Solo lectura. */
export default function ProductionDetailDialog({ open, onOpenChange, production }: ProductionDetailDialogProps) {
    // `production` puede quedar en null un instante mientras el diálogo anima su cierre
    // (el manager lo vacía apenas `onOpenChange(false)`): todo lo que sigue usa acceso
    // opcional para no romper esa transición, igual que el resto de los diálogos de detalle.
    const title = `Producción de ${production?.supply?.name ?? "preparado"}`
    const date = production ? formatDate(production.produced_at) : ""
    const unit = production?.supply?.unit ?? ""
    const movements = [...(production?.stock_movement ?? [])]
        .sort((first, second) => first.quantity - second.quantity)

    return (
        <DialogShell
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={production
                ? `${date} · ${production.quantity} ${unit} a ${formatCurrency(production.unit_cost)} cada una · no se edita ni se borra.`
                : ""}
            mobileDescription={production ? `${date} · ${production.quantity} ${unit} · no se edita ni se borra` : ""}
            mobileBarTitle="Detalle de producción"
            mobileShowTitle
            widthClass="sm:max-w-[820px]"
            footerClassName="hidden sm:flex"
            footer={<Button variant="outline" className="h-10" onClick={() => onOpenChange(false)}>Cerrar</Button>}
        >
            <Card className="hidden overflow-hidden p-0 shadow-none sm:block">
                <Table className="text-sm">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-4 text-[13px] font-semibold text-muted-foreground">Insumo</TableHead>
                            <TableHead className="text-[13px] font-semibold text-muted-foreground">Movimiento</TableHead>
                            <TableHead className="text-right text-[13px] font-semibold text-muted-foreground">Cantidad</TableHead>
                            <TableHead className="text-right text-[13px] font-semibold text-muted-foreground">Costo unitario</TableHead>
                            <TableHead className="pr-4 text-right text-[13px] font-semibold text-muted-foreground">Importe</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {movements.map((movement) => {
                            const ingreso = isIngreso(movement)
                            const movementUnit = movement.supply?.unit ?? ""

                            return (
                                <TableRow key={movement.id}>
                                    <TableCell className="py-2 pl-4 font-semibold">
                                        {movement.supply?.name ?? `Insumo #${movement.supply_id}`}
                                    </TableCell>
                                    <TableCell className="py-2"><MovementBadge ingreso={ingreso} /></TableCell>
                                    <TableCell className="py-2 text-right font-semibold tabular-nums">
                                        {ingreso ? "+" : "−"}{formatQuantity(movement.quantity)} {movementUnit}
                                    </TableCell>
                                    <TableCell className="py-2 text-right tabular-nums">
                                        {formatCurrency(movement.unit_cost)}/{movementUnit}
                                    </TableCell>
                                    <TableCell className="py-2 pr-4 text-right">
                                        <Money value={Math.abs(movement.quantity) * movement.unit_cost} size="sm" />
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </Card>

            <Card className="gap-0 px-3.5 py-1 sm:hidden">
                {movements.map((movement) => {
                    const ingreso = isIngreso(movement)
                    const movementUnit = movement.supply?.unit ?? ""

                    return (
                        <div key={movement.id} className="flex items-start justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
                            <div className="flex flex-col gap-0.5">
                                <span className="font-semibold">{movement.supply?.name ?? `Insumo #${movement.supply_id}`}</span>
                                <span className={cn("text-[13px]", ingreso ? "text-success-muted-foreground" : "text-muted-foreground")}>
                                    {STOCK_MOVEMENT_TYPE_LABELS[ingreso ? "production_in" : "production_out"]} · {formatCurrency(movement.unit_cost)}/{movementUnit}
                                </span>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                                <span className={cn("font-semibold tabular-nums", ingreso && "text-success-muted-foreground")}>
                                    {ingreso ? "+" : "−"}{formatQuantity(movement.quantity)} {movementUnit}
                                </span>
                                <span className="text-[13px] tabular-nums text-muted-foreground">
                                    {formatCurrency(Math.abs(movement.quantity) * movement.unit_cost)}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </Card>

            {production?.note && (
                <p className="text-sm text-muted-foreground">Nota: {production.note}</p>
            )}
        </DialogShell>
    )
}
