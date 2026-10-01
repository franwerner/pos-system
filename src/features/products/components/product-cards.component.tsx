"use client"

import { Pencil, Power } from "lucide-react"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Money } from "@/shared/components/money.component"
import { RecordCard } from "@/shared/components/record-card.component"
import { InactiveBadge } from "@/shared/components/row-actions.component"
import { type AdminProduct } from "../types/admin-product.type"

interface ProductCardsProps {
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

/** Celular (< md): una `RecordCard` por producto, con la tabla oculta en su lugar. */
export default function ProductCards({ products, onEdit, onToggleActive }: ProductCardsProps) {
    return (
        <div className="flex flex-col gap-2.5">
            {products.map((product) => (
                <RecordCard
                    key={product.id}
                    title={product.name}
                    subtitle={product.category?.name ?? "Sin categoría"}
                    value={<Money value={product.price} className="text-lg" />}
                    inactive={!product.is_active}
                    badges={(
                        <>
                            {!product.is_active && <InactiveBadge />}
                            <CompositionBadge count={product.composition_count} />
                        </>
                    )}
                    actions={(
                        <>
                            <Button variant="outline" size="sm" className="h-10 gap-1.5" onClick={() => onEdit(product)}>
                                <Pencil className="size-4" aria-hidden /> Editar
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-10"
                                aria-label={product.is_active ? "Desactivar" : "Reactivar"}
                                onClick={() => onToggleActive(product)}
                            >
                                <Power className="size-4" aria-hidden />
                            </Button>
                        </>
                    )}
                />
            ))}
        </div>
    )
}
