"use client"

import { Pencil, Utensils } from "lucide-react"
import { Badge } from "@/shared/components/ui/badge"
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
import {
    SUPPLY_TYPE_LABELS,
    SUPPLY_UNIT_LABELS,
    type Supply,
} from "../types/supply.type"

interface SupplyTableProps {
    supplies: Supply[]
    onEdit: (supply: Supply) => void
    onToggleActive: (supply: Supply) => void
    onCreateProduct: (supply: Supply) => void
}

export default function SupplyTable({
    supplies,
    onEdit,
    onToggleActive,
    onCreateProduct,
}: SupplyTableProps) {
    if (supplies.length === 0) {
        return (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                No hay insumos que coincidan con el filtro.
            </p>
        )
    }

    return (
        <div className="rounded-lg border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead className="text-right">Precio de compra</TableHead>
                        <TableHead className="text-right">Rendimiento</TableHead>
                        <TableHead className="text-right">Stock mínimo</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {supplies.map((supply) => (
                        <TableRow key={supply.id} className={supply.is_active ? undefined : "opacity-60"}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    {supply.name}
                                    {!supply.is_active && <Badge variant="outline">Inactivo</Badge>}
                                </div>
                            </TableCell>
                            <TableCell>{SUPPLY_TYPE_LABELS[supply.type]}</TableCell>
                            <TableCell>{SUPPLY_UNIT_LABELS[supply.unit]}</TableCell>
                            <TableCell className="text-right">{formatCurrency(supply.purchase_price)}</TableCell>
                            <TableCell className="text-right">{supply.yield_factor}</TableCell>
                            <TableCell className="text-right">{supply.min_stock}</TableCell>
                            <TableCell>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onEdit(supply)}>
                                        <Pencil className="h-4 w-4" />
                                        Editar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onCreateProduct(supply)}>
                                        <Utensils className="h-4 w-4" />
                                        Crear producto
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={supply.is_active ? "destructive" : "secondary"}
                                        onClick={() => onToggleActive(supply)}>
                                        {supply.is_active ? "Desactivar" : "Reactivar"}
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
