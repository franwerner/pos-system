"use client"

import { Pencil, Plus, Power, RefreshCw } from "lucide-react"
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
import { isPreparedWithoutCost } from "../services/isPreparedWithoutCost.service"
import {
    SUPPLY_TYPE_LABELS,
    SUPPLY_UNIT_LABELS,
    type SupplyWithCost,
} from "../types/supply.type"

interface SupplyTableProps {
    supplies: SupplyWithCost[]
    onEdit: (supply: SupplyWithCost) => void
    onToggleActive: (supply: SupplyWithCost) => void
    onCreateProduct: (supply: SupplyWithCost) => void
}

// Rendimiento y stock mínimo son cantidades libres (no moneda): se formatean con el
// separador decimal/miles de es-AR igual que el diseño ("0,85", "2.000"), sin agregar
// un util nuevo para un solo número (mismo criterio que `required-sales.component.tsx`).
const formatQuantity = (value: number) => new Intl.NumberFormat("es-AR").format(value)

/** Badge de Origen "Preparado" (se produce, no se compra). Se reusa en `SupplyCards`. */
export function PreparedBadge() {
    return (
        <Badge
            variant="secondary"
            className="rounded-full bg-info-muted text-xs font-semibold text-info-muted-foreground"
        >
            Preparado
        </Badge>
    )
}

/** Tabla de escritorio (md+): la versión celular es `SupplyCards`. */
export default function SupplyTable({ supplies, onEdit, onToggleActive, onCreateProduct }: SupplyTableProps) {
    return (
        <Card className="hidden overflow-hidden p-0 md:block">
            <Table className="whitespace-nowrap text-sm">
                <TableHeader>
                    <TableRow>
                        <TableHead className="px-2 text-[13px] font-semibold text-muted-foreground">Nombre</TableHead>
                        <TableHead className="px-2 text-[13px] font-semibold text-muted-foreground">Tipo</TableHead>
                        <TableHead className="px-2 text-[13px] font-semibold text-muted-foreground">Unidad</TableHead>
                        <TableHead className="whitespace-normal px-2 text-right text-[13px] font-semibold leading-tight text-muted-foreground">
                            Precio de compra
                        </TableHead>
                        <TableHead className="whitespace-normal px-2 text-right text-[13px] font-semibold leading-tight text-muted-foreground">
                            Rendimiento
                        </TableHead>
                        <TableHead className="whitespace-normal px-2 text-right text-[13px] font-semibold leading-tight text-muted-foreground">
                            Stock mínimo
                        </TableHead>
                        <TableHead className="px-2 text-right text-[13px] font-semibold text-muted-foreground">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {supplies.map((supply) => {
                        const prepared = supply.origin === "produced"
                        // Un preparado que nunca se produjo no tiene precio de compra: el $0 es real,
                        // no un placeholder. Uno que ya se produjo sí tiene costo (el de su última
                        // producción), y esta tabla lo muestra en vez de simular siempre "$0".
                        const withoutCost = isPreparedWithoutCost(supply)

                        return (
                            <TableRow key={supply.id} className={cn(!supply.is_active && "opacity-55")}>
                                <TableCell className="p-2">
                                    <span className="flex items-center gap-2">
                                        <span className="font-semibold">{supply.name}</span>
                                        {prepared && <PreparedBadge />}
                                        {!supply.is_active && <InactiveBadge />}
                                    </span>
                                </TableCell>
                                <TableCell className="p-2">{SUPPLY_TYPE_LABELS[supply.type]}</TableCell>
                                <TableCell className="p-2">{SUPPLY_UNIT_LABELS[supply.unit]}</TableCell>
                                <TableCell className="p-2 text-right">
                                    {withoutCost ? (
                                        <>
                                            <Money value={0} size="sm" tone="muted" className="font-normal" />
                                            <span className="block text-[13px] text-muted-foreground">se produce</span>
                                        </>
                                    ) : (
                                        <Money
                                            value={prepared ? supply.last_production_unit_cost ?? 0 : supply.purchase_price}
                                            size="sm"
                                            className="font-normal"
                                        />
                                    )}
                                </TableCell>
                                <TableCell className="p-2 text-right tabular-nums">
                                    {formatQuantity(supply.yield_factor)}
                                </TableCell>
                                <TableCell className="p-2 text-right tabular-nums">
                                    {formatQuantity(supply.min_stock)}
                                </TableCell>
                                <TableCell className="p-2">
                                    <RowActions
                                        actions={[
                                            { label: "Editar", icon: Pencil, onClick: () => onEdit(supply) },
                                            {
                                                label: "Crear producto",
                                                icon: Plus,
                                                tone: "muted",
                                                onClick: () => onCreateProduct(supply),
                                            },
                                            supply.is_active
                                                ? {
                                                      label: "Desactivar",
                                                      icon: Power,
                                                      tone: "muted",
                                                      onClick: () => onToggleActive(supply),
                                                  }
                                                : {
                                                      label: "Reactivar",
                                                      icon: RefreshCw,
                                                      onClick: () => onToggleActive(supply),
                                                  },
                                        ]}
                                        className="gap-0.5"
                                    />
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </Card>
    )
}

export { formatQuantity }
