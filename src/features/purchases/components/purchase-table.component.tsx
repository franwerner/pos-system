"use client"

import { Eye } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
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
import { type PurchaseWithItems } from "../types/purchase.type"

interface PurchaseTableProps {
    purchases: PurchaseWithItems[]
    onShowDetail: (purchase: PurchaseWithItems) => void
}

export default function PurchaseTable({ purchases, onShowDetail }: PurchaseTableProps) {
    if (purchases.length === 0) {
        return (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                Todavía no hay compras cargadas.
            </p>
        )
    }

    return (
        <div className="rounded-lg border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead className="text-right">Líneas</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Nota</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {purchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                            <TableCell className="whitespace-nowrap">
                                {formatDate(purchase.purchased_at)}
                            </TableCell>
                            <TableCell className="font-medium">
                                {purchase.supplier_name ?? "Sin proveedor"}
                            </TableCell>
                            <TableCell className="text-right">{purchase.purchase_item.length}</TableCell>
                            <TableCell className="text-right font-medium">
                                {formatCurrency(purchase.total)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{purchase.note ?? "—"}</TableCell>
                            <TableCell>
                                <div className="flex justify-end">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onShowDetail(purchase)}>
                                        <Eye className="h-4 w-4" />
                                        Ver detalle
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
