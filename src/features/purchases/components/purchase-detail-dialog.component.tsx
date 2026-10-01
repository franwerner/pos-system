"use client"

import { Receipt } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table"
import { DialogShell } from "@/shared/components/dialog-shell.component"
import { Money } from "@/shared/components/money.component"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import formatDate from "@/shared/utils/formatDate.util"
import { calculateLineAmount } from "../services/calculatePurchaseTotal.service"
import { type PurchaseWithItems } from "../types/purchase.type"

// Cantidades no son moneda: mismo criterio que el resto del admin
// (`formatQuantity` en `stock-table.component.tsx` / `supply-table.component.tsx`).
const formatQuantity = (value: number) => new Intl.NumberFormat("es-AR").format(value)

const formatUnitPrice = (unitPrice: number, unit: string | undefined) =>
    unit ? `${formatCurrency(unitPrice)}/${unit}` : formatCurrency(unitPrice)

const lineCountLabel = (count: number) => (count === 1 ? "1 línea" : `${count} líneas`)

interface PurchaseDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    purchase: PurchaseWithItems | null
}

/** Detalle de una compra registrada: solo lectura (no se edita ni se borra). */
export default function PurchaseDetailDialog({ open, onOpenChange, purchase }: PurchaseDetailDialogProps) {
    // `purchase` puede quedar en null un instante mientras el diálogo anima su cierre
    // (el manager lo vacía apenas `onOpenChange(false)`): todo lo que sigue usa
    // acceso opcional para no romper esa transición, igual que la versión anterior.
    const title = purchase?.supplier_name
        ? `Compra a ${purchase.supplier_name}`
        : "Compra sin proveedor"
    const count = lineCountLabel(purchase?.purchase_item.length ?? 0)
    const date = purchase ? formatDate(purchase.purchased_at) : ""
    const items = purchase?.purchase_item ?? []

    return (
        <DialogShell
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={`${date} · ${count} · Una compra registrada no se edita ni se borra.`}
            mobileDescription={`${date} · ${count} · no se edita ni se borra`}
            mobileBarTitle="Detalle de compra"
            mobileShowTitle
            widthClass="sm:max-w-[720px]"
            footer={
                <>
                    {/* Celular: total y nota fijos abajo */}
                    <div className="flex items-center justify-between gap-3 sm:hidden">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">Total de la compra</span>
                            {purchase?.note && <span className="text-[13px] text-muted-foreground">Nota: {purchase.note}</span>}
                        </div>
                        <Money value={purchase?.total ?? 0} size="lg" className="text-[28px]" />
                    </div>
                    <Button variant="outline" className="hidden h-10 sm:inline-flex" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </>
            }
        >
            {/* Escritorio: tabla con total al pie */}
            <Card className="hidden overflow-hidden p-0 shadow-none sm:block">
                <Table className="text-sm">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-4 text-[13px] font-semibold text-muted-foreground">Insumo</TableHead>
                            <TableHead className="text-right text-[13px] font-semibold text-muted-foreground">Cantidad</TableHead>
                            <TableHead className="text-right text-[13px] font-semibold text-muted-foreground">Precio unitario</TableHead>
                            <TableHead className="pr-4 text-right text-[13px] font-semibold text-muted-foreground">Importe</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="py-2 pl-4 font-semibold">
                                    {item.supply?.name ?? `Insumo #${item.supply_id}`}
                                </TableCell>
                                <TableCell className="py-2 text-right tabular-nums">
                                    {formatQuantity(item.quantity)} {item.supply?.unit ?? ""}
                                </TableCell>
                                <TableCell className="py-2 text-right tabular-nums">
                                    {formatUnitPrice(item.unit_price, item.supply?.unit)}
                                </TableCell>
                                <TableCell className="py-2 pr-4 text-right">
                                    <Money value={calculateLineAmount(item)} size="sm" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter className="bg-muted">
                        <TableRow>
                            <TableCell colSpan={3} className="py-2 pl-4 font-bold">Total</TableCell>
                            <TableCell className="py-2 pr-4 text-right">
                                <Money value={purchase?.total ?? 0} size="sm" className="text-base font-bold" />
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </Card>
            {purchase?.note && (
                <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                    <Receipt className="size-4" aria-hidden />
                    <span><span className="font-semibold text-foreground">Nota:</span> {purchase.note}</span>
                </div>
            )}

            {/* Celular: lista "5.000 gr × $10,50/gr" */}
            <Card className="gap-0 px-3.5 py-1 sm:hidden">
                {items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between border-b border-border py-2.5 last:border-b-0">
                        <div className="flex flex-col gap-0.5">
                            <span className="font-semibold">{item.supply?.name ?? `Insumo #${item.supply_id}`}</span>
                            <span className="text-[13px] tabular-nums text-muted-foreground">
                                {formatQuantity(item.quantity)} {item.supply?.unit ?? ""} × {formatUnitPrice(item.unit_price, item.supply?.unit)}
                            </span>
                        </div>
                        <Money value={calculateLineAmount(item)} size="sm" />
                    </div>
                ))}
            </Card>
        </DialogShell>
    )
}
