"use client"

import { Eye } from "lucide-react"
import { Card } from "@/shared/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table"
import { Money } from "@/shared/components/money.component"
import { RowActions } from "@/shared/components/row-actions.component"
import formatDate from "@/shared/utils/formatDate.util"
import { type PurchaseWithItems } from "../types/purchase.type"

export const PURCHASE_TABLE_HEADERS = ["Fecha", "Proveedor", "Líneas", "Total", "Nota", "Acciones"]

interface PurchaseTableProps {
    purchases: PurchaseWithItems[]
    onShowDetail: (purchase: PurchaseWithItems) => void
}

/** Escritorio (md+): tabla. La versión celular es `PurchaseCards`. */
export default function PurchaseTable({ purchases, onShowDetail }: PurchaseTableProps) {
    return (
        <Card className="hidden overflow-hidden p-0 md:block">
            <Table className="text-[15px]">
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-[13px] font-semibold text-muted-foreground">Fecha</TableHead>
                        <TableHead className="text-[13px] font-semibold text-muted-foreground">Proveedor</TableHead>
                        <TableHead className="text-right text-[13px] font-semibold text-muted-foreground">Líneas</TableHead>
                        <TableHead className="text-right text-[13px] font-semibold text-muted-foreground">Total</TableHead>
                        <TableHead className="text-[13px] font-semibold text-muted-foreground">Nota</TableHead>
                        <TableHead className="text-right text-[13px] font-semibold text-muted-foreground">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {purchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                            <TableCell className="py-3 tabular-nums">{formatDate(purchase.purchased_at)}</TableCell>
                            <TableCell className="py-3">
                                {purchase.supplier_name
                                    ? <span className="font-semibold">{purchase.supplier_name}</span>
                                    : <span className="text-muted-foreground">Sin proveedor</span>}
                            </TableCell>
                            <TableCell className="py-3 text-right tabular-nums">
                                {purchase.purchase_item.length}
                            </TableCell>
                            <TableCell className="py-3 text-right">
                                <Money value={purchase.total} size="sm" className="text-[15px]" />
                            </TableCell>
                            <TableCell className="py-3 text-sm">
                                {purchase.note ?? <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="py-3">
                                <RowActions
                                    actions={[{ label: "Ver detalle", icon: Eye, onClick: () => onShowDetail(purchase) }]}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    )
}
