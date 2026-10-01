"use client"

import { Eye } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Money } from "@/shared/components/money.component"
import { RecordCard } from "@/shared/components/record-card.component"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import formatDate from "@/shared/utils/formatDate.util"
import { type ProductionWithDetail } from "../types/production.type"

interface ProductionCardsProps {
    productions: ProductionWithDetail[]
    onShowDetail: (production: ProductionWithDetail) => void
}

/** Celular (< md): una tarjeta por producción. La versión de escritorio es `ProductionTable`. */
export default function ProductionCards({ productions, onShowDetail }: ProductionCardsProps) {
    return (
        <div className="flex flex-col gap-3 md:hidden">
            {productions.map((production) => (
                <RecordCard
                    key={production.id}
                    title={production.supply?.name ?? `Insumo #${production.supply_id}`}
                    subtitle={`${formatDate(production.produced_at)} · ${production.quantity} ${production.supply?.unit ?? ""}`}
                    value={<Money value={production.unit_cost * production.quantity} className="text-lg" />}
                    badges={
                        <div className="flex flex-col gap-0.5 text-[13px] text-muted-foreground">
                            <span className="tabular-nums">{formatCurrency(production.unit_cost)} por unidad</span>
                            {production.note && <span>{production.note}</span>}
                        </div>
                    }
                    actions={
                        <Button variant="outline" size="sm" className="h-10 gap-1.5" onClick={() => onShowDetail(production)}>
                            <Eye className="size-4" aria-hidden />
                            Ver detalle
                        </Button>
                    }
                />
            ))}
        </div>
    )
}
