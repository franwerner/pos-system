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
import formatCurrency from "@/shared/utils/formatCurrency.util"
import formatDate from "@/shared/utils/formatDate.util"
import { type ProductionWithDetail } from "../types/production.type"

export const PRODUCTION_TABLE_HEADERS = [
    "Fecha", "Preparado", "Unidades", "Costo unitario", "Costo total", "Nota", "Acciones",
]

interface ProductionTableProps {
    productions: ProductionWithDetail[]
    onShowDetail: (production: ProductionWithDetail) => void
}

/** Escritorio (md+): tabla. La versión celular es `ProductionCards`. */
export default function ProductionTable({ productions, onShowDetail }: ProductionTableProps) {
    return (
        <Card className="hidden overflow-hidden p-0 md:block">
            <Table className="text-[15px]">
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-[13px] font-semibold text-muted-foreground">Fecha</TableHead>
                        <TableHead className="text-[13px] font-semibold text-muted-foreground">Preparado</TableHead>
                        <TableHead className="text-right text-[13px] font-semibold text-muted-foreground">Unidades</TableHead>
                        <TableHead className="text-right text-[13px] font-semibold text-muted-foreground">Costo unitario</TableHead>
                        <TableHead className="text-right text-[13px] font-semibold text-muted-foreground">Costo total</TableHead>
                        <TableHead className="text-[13px] font-semibold text-muted-foreground">Nota</TableHead>
                        <TableHead className="text-right text-[13px] font-semibold text-muted-foreground">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {productions.map((production) => (
                        <TableRow key={production.id}>
                            <TableCell className="py-3 tabular-nums">
                                {formatDate(production.produced_at)}
                            </TableCell>
                            <TableCell className="py-3 font-semibold">
                                {production.supply?.name ?? `Insumo #${production.supply_id}`}
                            </TableCell>
                            <TableCell className="py-3 text-right tabular-nums">
                                {production.quantity} {production.supply?.unit ?? ""}
                            </TableCell>
                            <TableCell className="py-3 text-right tabular-nums">
                                {formatCurrency(production.unit_cost)}
                            </TableCell>
                            <TableCell className="py-3 text-right">
                                <Money value={production.unit_cost * production.quantity} size="sm" className="text-[15px]" />
                            </TableCell>
                            <TableCell className="py-3 text-sm">
                                {production.note ?? <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="py-3">
                                <RowActions
                                    actions={[{ label: "Ver detalle", icon: Eye, onClick: () => onShowDetail(production) }]}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    )
}
