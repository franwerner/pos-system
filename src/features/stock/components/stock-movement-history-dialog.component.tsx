"use client"

import { Clock } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/shared/components/ui/dialog"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table"
import { EmptyState } from "@/shared/components/empty-state.component"
import { cn } from "@/shared/utils/cn.util"
import formatDate from "@/shared/utils/formatDate.util"
import useGetStockMovements from "../hooks/useGetStockMovements.hook"
import { sumStockMovements } from "../services/calculateStock.service"
import {
    STOCK_MOVEMENT_TYPE_LABELS,
    type StockMovement,
    type SupplyStock,
} from "../types/stock.type"
import { formatQuantity } from "./stock-table.component"

const describeOrigin = (movement: StockMovement): string => {
    if (movement.purchase_id) return `Compra #${movement.purchase_id}`
    if (movement.sale_id) return `Venta #${movement.sale_id}`
    if (movement.production_id) return `Producción #${movement.production_id}`
    return "Carga manual"
}

// "+" solo del lado que suma: un movimiento negativo ya trae su propio signo.
const quantityLabel = (quantity: number) => (quantity > 0 ? `+${formatQuantity(quantity)}` : formatQuantity(quantity))

/** Verde si el movimiento suma al stock, rojo si resta. Mismo tono que "Stock actual". */
function QuantityCell({ quantity }: { quantity: number }) {
    return (
        <span
            className={cn(
                "font-bold tabular-nums",
                quantity >= 0 ? "text-success-muted-foreground" : "text-negative",
            )}
        >
            {quantityLabel(quantity)}
        </span>
    )
}

interface StockMovementHistoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    supplyStock: SupplyStock | null
}

// El historial es de solo lectura (un botón "Cerrar", sin acción): un `Dialog` alcanza, no
// hace falta el wrapper de formularios (mismo criterio documentado en
// `Design/export/10-admin-stock/README.md`, sección Decisiones).
export default function StockMovementHistoryDialog({
    open,
    onOpenChange,
    supplyStock,
}: StockMovementHistoryDialogProps) {
    const { data: movements, isLoading } = useGetStockMovements(
        open && supplyStock ? supplyStock.supply_id : null,
    )
    const rows = movements ?? []
    const empty = !isLoading && rows.length === 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-extrabold">
                        Movimientos de {supplyStock?.name}
                    </DialogTitle>
                    <DialogDescription>
                        El stock actual es la suma de estos movimientos:{" "}
                        <b className="tabular-nums text-foreground">
                            {formatQuantity(sumStockMovements(rows))} {supplyStock?.unit}
                        </b>
                        .
                    </DialogDescription>
                </DialogHeader>

                {empty ? (
                    <EmptyState
                        icon={Clock}
                        title="Este insumo todavía no tiene movimientos."
                        description="El stock sube con compras, producción o ajustes, y baja con ventas, producción o pérdidas."
                    />
                ) : (
                    <>
                        {/* sm+: tabla */}
                        <div
                            className="hidden max-h-[55vh] overflow-y-auto rounded-xl border border-border sm:block"
                            aria-busy={isLoading || undefined}
                        >
                            <Table className="text-[15px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="px-4 text-[13px] font-semibold text-muted-foreground">
                                            Fecha
                                        </TableHead>
                                        <TableHead className="px-4 text-[13px] font-semibold text-muted-foreground">
                                            Tipo
                                        </TableHead>
                                        <TableHead className="px-4 text-right text-[13px] font-semibold text-muted-foreground">
                                            Cantidad
                                        </TableHead>
                                        <TableHead className="px-4 text-[13px] font-semibold text-muted-foreground">
                                            Origen
                                        </TableHead>
                                        <TableHead className="px-4 text-[13px] font-semibold text-muted-foreground">
                                            Nota
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading
                                        ? Array.from({ length: 6 }, (_, i) => (
                                              <TableRow key={i}>
                                                  <TableCell className="px-4 py-3">
                                                      <Skeleton className="h-3.5 w-[90px]" />
                                                  </TableCell>
                                                  <TableCell className="px-4 py-3">
                                                      <Skeleton className="h-3.5 w-[120px]" />
                                                  </TableCell>
                                                  <TableCell className="px-4 py-3">
                                                      <Skeleton className="h-3.5 w-20" />
                                                  </TableCell>
                                                  <TableCell className="px-4 py-3">
                                                      <Skeleton className="h-3.5 w-[100px]" />
                                                  </TableCell>
                                                  <TableCell className="px-4 py-3">
                                                      <Skeleton className="h-3.5 w-40" />
                                                  </TableCell>
                                              </TableRow>
                                          ))
                                        : rows.map((movement) => (
                                              <TableRow key={movement.id}>
                                                  <TableCell className="whitespace-nowrap px-4 py-3 tabular-nums">
                                                      {formatDate(movement.created_at)}
                                                  </TableCell>
                                                  <TableCell className="px-4 py-3">
                                                      {STOCK_MOVEMENT_TYPE_LABELS[movement.type]}
                                                  </TableCell>
                                                  <TableCell className="px-4 py-3 text-right">
                                                      <QuantityCell quantity={movement.quantity} />
                                                  </TableCell>
                                                  <TableCell className="px-4 py-3">{describeOrigin(movement)}</TableCell>
                                                  <TableCell className="px-4 py-3 text-muted-foreground">
                                                      {movement.note ?? "—"}
                                                  </TableCell>
                                              </TableRow>
                                          ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* celular: lista */}
                        <div
                            className="max-h-[65vh] overflow-y-auto rounded-xl border border-border px-4 sm:hidden"
                            aria-busy={isLoading || undefined}
                        >
                            {isLoading
                                ? Array.from({ length: 5 }, (_, i) => (
                                      <div
                                          key={i}
                                          className="flex items-center justify-between gap-2.5 border-b border-border py-3 last:border-b-0"
                                      >
                                          <div className="flex flex-col gap-1.5">
                                              <Skeleton className="h-4 w-24" />
                                              <Skeleton className="h-3 w-40" />
                                          </div>
                                          <Skeleton className="h-4 w-16" />
                                      </div>
                                  ))
                                : rows.map((movement) => (
                                      <div
                                          key={movement.id}
                                          className="flex items-center justify-between gap-2.5 border-b border-border py-3 last:border-b-0"
                                      >
                                          <div className="flex flex-col gap-0.5">
                                              <span className="font-semibold">
                                                  {STOCK_MOVEMENT_TYPE_LABELS[movement.type]}
                                              </span>
                                              <span className="text-[13px] text-muted-foreground">
                                                  {formatDate(movement.created_at)} · {describeOrigin(movement)}
                                              </span>
                                              {movement.note && (
                                                  <span className="text-[13px] text-muted-foreground">
                                                      {movement.note}
                                                  </span>
                                              )}
                                          </div>
                                          <QuantityCell quantity={movement.quantity} />
                                      </div>
                                  ))}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
