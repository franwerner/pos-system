"use client"

import { Pencil, Power } from "lucide-react"
import { Badge } from "@/shared/components/ui/badge"
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
import { InactiveBadge, RowActions } from "@/shared/components/row-actions.component"
import { cn } from "@/shared/utils/cn.util"
import { type AdminProduct } from "../types/admin-product.type"

interface ProductTableProps {
    products: AdminProduct[]
    onEdit: (product: AdminProduct) => void
    onToggleActive: (product: AdminProduct) => void
}

function CompositionBadge({ count }: { count: number }) {
    return count === 0 ? (
        <Badge variant="secondary" className="rounded-full font-semibold text-muted-foreground">
            Sin composición
        </Badge>
    ) : (
        <Badge className="rounded-full border-transparent bg-accent font-semibold text-accent-foreground">
            {count} insumo{count > 1 ? "s" : ""}
        </Badge>
    )
}

/** Tabla de escritorio (md+): la versión celular es `ProductCards`. */
export default function ProductTable({ products, onEdit, onToggleActive }: ProductTableProps) {
    return (
        <Card className="overflow-hidden p-0">
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
                        <TableRow key={product.id} className={cn(!product.is_active && "opacity-55")}>
                            <TableCell className="font-semibold">
                                <span className="flex items-center gap-2">
                                    {product.name}
                                    {!product.is_active && <InactiveBadge />}
                                </span>
                            </TableCell>
                            <TableCell className={cn(!product.category && "text-muted-foreground")}>
                                {product.category?.name ?? "Sin categoría"}
                            </TableCell>
                            <TableCell className="text-right">
                                <Money value={product.price} size="sm" className="text-[15px]" />
                            </TableCell>
                            <TableCell>
                                <CompositionBadge count={product.composition_count} />
                            </TableCell>
                            <TableCell>
                                <RowActions
                                    actions={[
                                        { label: "Editar", icon: Pencil, onClick: () => onEdit(product) },
                                        {
                                            label: product.is_active ? "Desactivar" : "Reactivar",
                                            icon: Power,
                                            onClick: () => onToggleActive(product),
                                        },
                                    ]}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    )
}
