"use client"

import { Eye } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Money } from "@/shared/components/money.component"
import { RecordCard } from "@/shared/components/record-card.component"
import formatDate from "@/shared/utils/formatDate.util"
import { type PurchaseWithItems } from "../types/purchase.type"

const lineCountLabel = (count: number) => (count === 1 ? "1 línea" : `${count} líneas`)

interface PurchaseCardsProps {
    purchases: PurchaseWithItems[]
    onShowDetail: (purchase: PurchaseWithItems) => void
}

/** Celular (< md): una tarjeta por compra. La versión de escritorio es `PurchaseTable`. */
export default function PurchaseCards({ purchases, onShowDetail }: PurchaseCardsProps) {
    return (
        <div className="flex flex-col gap-3 md:hidden">
            {purchases.map((purchase) => (
                <RecordCard
                    key={purchase.id}
                    title={purchase.supplier_name ?? "Sin proveedor"}
                    subtitle={`${formatDate(purchase.purchased_at)} · ${lineCountLabel(purchase.purchase_item.length)}`}
                    value={<Money value={purchase.total} className="text-lg" />}
                    badges={purchase.note ? <span className="text-[13px] text-muted-foreground">{purchase.note}</span> : undefined}
                    actions={
                        <Button variant="outline" size="sm" className="h-10 gap-1.5" onClick={() => onShowDetail(purchase)}>
                            <Eye className="size-4" aria-hidden />
                            Ver detalle
                        </Button>
                    }
                />
            ))}
        </div>
    )
}
