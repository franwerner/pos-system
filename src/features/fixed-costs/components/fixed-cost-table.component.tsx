"use client"

import { Pencil, Trash2 } from "lucide-react"
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
import { calculateFixedCostTotal } from "../services/calculateFixedCostTotal.service"
import { type FixedCost } from "../types/fixed-cost.type"

interface FixedCostTableProps {
    fixedCosts: FixedCost[]
    onEdit: (fixedCost: FixedCost) => void
    onDelete: (fixedCost: FixedCost) => void
}

export default function FixedCostTable({ fixedCosts, onEdit, onDelete }: FixedCostTableProps) {
    if (fixedCosts.length === 0) {
        return (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                El mes no tiene costos fijos cargados.
            </p>
        )
    }

    return (
        <div className="rounded-lg border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {fixedCosts.map((fixedCost) => (
                        <TableRow key={fixedCost.id}>
                            <TableCell className="font-medium">{fixedCost.concept}</TableCell>
                            <TableCell className="text-right">{formatCurrency(fixedCost.amount)}</TableCell>
                            <TableCell>
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="outline" onClick={() => onEdit(fixedCost)}>
                                        <Pencil className="h-4 w-4" />
                                        Editar
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => onDelete(fixedCost)}>
                                        <Trash2 className="h-4 w-4" />
                                        Eliminar
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    <TableRow className="bg-muted/40 font-semibold">
                        <TableCell>Total del mes</TableCell>
                        <TableCell className="text-right">
                            {formatCurrency(calculateFixedCostTotal(fixedCosts))}
                        </TableCell>
                        <TableCell />
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    )
}
