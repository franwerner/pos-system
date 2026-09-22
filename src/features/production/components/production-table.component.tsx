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
import { type ProductionWithDetail } from "../types/production.type"

interface ProductionTableProps {
    productions: ProductionWithDetail[]
    onShowDetail: (production: ProductionWithDetail) => void
}

export default function ProductionTable({ productions, onShowDetail }: ProductionTableProps) {
    if (productions.length === 0) {
        return (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                Todavía no hay producciones cargadas.
            </p>
        )
    }

    return (
        <div className="rounded-lg border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Preparado</TableHead>
                        <TableHead className="text-right">Unidades</TableHead>
                        <TableHead className="text-right">Costo unitario</TableHead>
                        <TableHead className="text-right">Costo total</TableHead>
                        <TableHead>Nota</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {productions.map((production) => (
                        <TableRow key={production.id}>
                            <TableCell className="whitespace-nowrap">
                                {formatDate(production.produced_at)}
                            </TableCell>
                            <TableCell className="font-medium">
                                {production.supply?.name ?? `Insumo #${production.supply_id}`}
                            </TableCell>
                            <TableCell className="text-right">
                                {production.quantity} {production.supply?.unit ?? ""}
                            </TableCell>
                            <TableCell className="text-right">
                                {formatCurrency(production.unit_cost)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {formatCurrency(production.unit_cost * production.quantity)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {production.note ?? "—"}
                            </TableCell>
                            <TableCell>
                                <div className="flex justify-end">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onShowDetail(production)}>
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
