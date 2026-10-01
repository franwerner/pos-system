"use client"

import { Pencil, Plus, Power, RefreshCw } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Money } from "@/shared/components/money.component"
import { InactiveBadge } from "@/shared/components/row-actions.component"
import { cn } from "@/shared/utils/cn.util"
import { isPreparedWithoutCost } from "../services/isPreparedWithoutCost.service"
import {
    SUPPLY_TYPE_LABELS,
    SUPPLY_UNIT_LABELS,
    type SupplyWithCost,
} from "../types/supply.type"
import { PreparedBadge, formatQuantity } from "./supply-table.component"

interface SupplyCardsProps {
    supplies: SupplyWithCost[]
    onEdit: (supply: SupplyWithCost) => void
    onToggleActive: (supply: SupplyWithCost) => void
    onCreateProduct: (supply: SupplyWithCost) => void
}

/**
 * Versión celular de una fila. Local en vez de `RecordCard`: el diseño le agrega una fila
 * intermedia (Rendimiento / Mínimo) que `RecordCard` no tiene (ver `admin-supplies.md`).
 */
function SupplyCard({
    supply,
    onEdit,
    onToggleActive,
    onCreateProduct,
}: {
    supply: SupplyWithCost
    onEdit: (supply: SupplyWithCost) => void
    onToggleActive: (supply: SupplyWithCost) => void
    onCreateProduct: (supply: SupplyWithCost) => void
}) {
    const prepared = supply.origin === "produced"
    const withoutCost = isPreparedWithoutCost(supply)
    const unitLabel = SUPPLY_UNIT_LABELS[supply.unit]

    return (
        <div
            className={cn(
                "flex flex-col gap-2 rounded-[14px] border border-border bg-card p-3.5",
                !supply.is_active && "opacity-55",
            )}
        >
            <div className="flex items-start justify-between gap-2.5">
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="flex items-center gap-1.5">
                        <span className="text-base font-semibold">{supply.name}</span>
                        {prepared && <PreparedBadge />}
                        {!supply.is_active && <InactiveBadge />}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                        {SUPPLY_TYPE_LABELS[supply.type]} · {unitLabel}
                    </span>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                    {withoutCost ? (
                        <Money value={0} tone="muted" className="text-[17px]" />
                    ) : (
                        <Money
                            value={prepared ? supply.last_production_unit_cost ?? 0 : supply.purchase_price}
                            className="text-[17px]"
                        />
                    )}
                    <span className="text-[13px] text-muted-foreground">
                        {withoutCost ? "se produce" : `por ${supply.unit}`}
                    </span>
                </div>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
                <span>
                    Rendimiento <b className="tabular-nums text-foreground">{formatQuantity(supply.yield_factor)}</b>
                </span>
                <span>
                    Mínimo{" "}
                    <b className="tabular-nums text-foreground">
                        {formatQuantity(supply.min_stock)} {supply.unit}
                    </b>
                </span>
            </div>
            <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" className="h-10 gap-1.5" onClick={() => onEdit(supply)}>
                    <Pencil className="size-4" aria-hidden /> Editar
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 gap-1.5 text-muted-foreground"
                    onClick={() => onCreateProduct(supply)}
                >
                    <Plus className="size-4" aria-hidden /> Crear producto
                </Button>
                <span className="flex-1" />
                {supply.is_active ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-10 text-muted-foreground"
                        aria-label="Desactivar"
                        onClick={() => onToggleActive(supply)}
                    >
                        <Power className="size-4" aria-hidden />
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-10"
                        aria-label="Reactivar"
                        onClick={() => onToggleActive(supply)}
                    >
                        <RefreshCw className="size-4" aria-hidden />
                    </Button>
                )}
            </div>
        </div>
    )
}

/** Celular (< md): una `SupplyCard` por insumo, con la tabla oculta en su lugar. */
export default function SupplyCards({ supplies, onEdit, onToggleActive, onCreateProduct }: SupplyCardsProps) {
    return (
        <div className="flex flex-col gap-4 md:hidden">
            {supplies.map((supply) => (
                <SupplyCard
                    key={supply.id}
                    supply={supply}
                    onEdit={onEdit}
                    onToggleActive={onToggleActive}
                    onCreateProduct={onCreateProduct}
                />
            ))}
        </div>
    )
}
