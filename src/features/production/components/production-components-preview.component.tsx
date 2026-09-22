"use client"

import { Badge } from "@/shared/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import { type ProductionComponent } from "../types/production.type"

interface ProductionComponentsPreviewProps {
    components: ProductionComponent[]
    producedQuantity: number
}

export default function ProductionComponentsPreview({
    components,
    producedQuantity,
}: ProductionComponentsPreviewProps) {
    if (components.length === 0) {
        return (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                Elegí un preparado para ver qué componentes consume.
            </p>
        )
    }

    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Componente</TableHead>
                        <TableHead className="text-right">Por unidad</TableHead>
                        <TableHead className="text-right">A consumir</TableHead>
                        <TableHead className="text-right">Costo unitario</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {components.map((component) => (
                        <TableRow key={component.supply_id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    {component.name}
                                    {component.origin === "produced" && component.unit_cost === 0 && (
                                        <Badge variant="outline">Sin producción previa</Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                {component.quantity} {component.unit}
                            </TableCell>
                            <TableCell className="text-right">
                                {component.quantity * producedQuantity} {component.unit}
                            </TableCell>
                            <TableCell className="text-right">
                                {formatCurrency(component.unit_cost)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {formatCurrency(component.quantity * producedQuantity * component.unit_cost)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
