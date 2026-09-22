"use client"

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
import { calculateLineAmount } from "../services/calculatePurchaseTotal.service"
import { type PurchaseWithItems } from "../types/purchase.type"

interface PurchaseDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    purchase: PurchaseWithItems | null
}

export default function PurchaseDetailDialog({
    open,
    onOpenChange,
    purchase,
}: PurchaseDetailDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        Compra a {purchase?.supplier_name ?? "proveedor sin nombre"}
                    </DialogTitle>
                    <DialogDescription>
                        {purchase ? `${formatDate(purchase.purchased_at)} · ${formatCurrency(purchase.total)}` : ""}
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Insumo</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                                <TableHead className="text-right">Precio unitario</TableHead>
                                <TableHead className="text-right">Importe</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(purchase?.purchase_item ?? []).map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {item.supply?.name ?? `Insumo #${item.supply_id}`}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.quantity} {item.supply?.unit ?? ""}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(item.unit_price)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(calculateLineAmount(item))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {purchase?.note && (
                    <p className="text-sm text-muted-foreground">{purchase.note}</p>
                )}
            </DialogContent>
        </Dialog>
    )
}
