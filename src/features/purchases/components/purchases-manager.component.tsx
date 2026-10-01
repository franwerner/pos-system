"use client"

import { Plus, Receipt } from "lucide-react"
import { useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { EmptyState } from "@/shared/components/empty-state.component"
import { PageHeader } from "@/shared/components/page-header.component"
import { TableSkeleton } from "@/shared/components/table-skeleton.component"
import useGetPurchases from "../hooks/useGetPurchases.hook"
import { type PurchaseWithItems } from "../types/purchase.type"
import PurchaseCards from "./purchase-cards.component"
import PurchaseDetailDialog from "./purchase-detail-dialog.component"
import PurchaseFormDialog from "./purchase-form-dialog.component"
import PurchaseTable, { PURCHASE_TABLE_HEADERS } from "./purchase-table.component"

/** Estado "Cargando": encabezados reales (tabla) o tarjetas de Skeleton (celular). */
function PurchasesLoading() {
    return (
        <>
            <div className="hidden md:block">
                <TableSkeleton
                    headers={PURCHASE_TABLE_HEADERS}
                    rows={5}
                    widths={["w-20", "w-[150px]", "w-[30px]", "w-[70px]", "w-[130px]", "w-[90px]"]}
                />
            </div>
            <div className="flex flex-col gap-3 md:hidden" aria-busy="true" aria-label="Cargando">
                {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-[104px] rounded-xl" />
                ))}
            </div>
        </>
    )
}

export default function PurchasesManager() {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [detailPurchase, setDetailPurchase] = useState<PurchaseWithItems | null>(null)

    const { data: purchases, isLoading } = useGetPurchases()

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Compras"
                description="Ingreso de mercadería: suma stock y actualiza el precio de compra del insumo."
                actions={
                    <Button size="lg" className="h-11 gap-2 md:h-10" onClick={() => setIsFormOpen(true)}>
                        <Plus className="size-5" aria-hidden />
                        Nueva compra
                    </Button>
                }
            />

            {isLoading ? (
                <PurchasesLoading />
            ) : (purchases ?? []).length === 0 ? (
                <Card className="p-5">
                    <EmptyState
                        icon={Receipt}
                        title="Todavía no hay compras cargadas."
                        description="Cuando cargues la primera factura o remito, el stock y el precio de cada insumo se actualizan solos."
                        action={
                            <Button className="h-11 gap-2 md:h-10" onClick={() => setIsFormOpen(true)}>
                                <Plus className="size-4" aria-hidden />
                                Nueva compra
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <>
                    <PurchaseTable purchases={purchases ?? []} onShowDetail={setDetailPurchase} />
                    <PurchaseCards purchases={purchases ?? []} onShowDetail={setDetailPurchase} />
                </>
            )}

            <PurchaseFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />

            <PurchaseDetailDialog
                open={!!detailPurchase}
                onOpenChange={(open) => !open && setDetailPurchase(null)}
                purchase={detailPurchase}
            />
        </div>
    )
}
