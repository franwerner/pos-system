"use client"

import { Pencil } from "lucide-react"
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
import { type AdminProduct } from "../types/admin-product.type"

interface ProductTableProps {
    products: AdminProduct[]
    onEdit: (product: AdminProduct) => void
    onToggleActive: (product: AdminProduct) => void
}

export default function ProductTable({ products, onEdit, onToggleActive }: ProductTableProps) {
    if (products.length === 0) {
        return (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                No hay productos que coincidan con el filtro.
            </p>
        )
    }

    return (
        <div className="rounded-lg border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead>Composición</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product) => (
                        <TableRow key={product.id} className={product.is_active ? undefined : "opacity-60"}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    {product.name}
                                    {!product.is_active && <Badge variant="outline">Inactivo</Badge>}
                                </div>
                            </TableCell>
                            <TableCell>{product.category?.name ?? "Sin categoría"}</TableCell>
                            <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                            <TableCell>
                                {product.composition_count === 0
                                    ? <Badge variant="outline">Sin composición</Badge>
                                    : (
                                        <span className="text-sm text-muted-foreground">
                                            {product.composition_count} insumo{product.composition_count > 1 ? "s" : ""}
                                        </span>
                                    )}
                            </TableCell>
                            <TableCell>
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="outline" onClick={() => onEdit(product)}>
                                        <Pencil className="h-4 w-4" />
                                        Editar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={product.is_active ? "destructive" : "secondary"}
                                        onClick={() => onToggleActive(product)}>
                                        {product.is_active ? "Desactivar" : "Reactivar"}
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
