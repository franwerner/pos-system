"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { Loader } from "@/shared/components/loader.component"
import { Button } from "@/shared/components/ui/button"
import useGetPurchases from "../hooks/useGetPurchases.hook"
import { type PurchaseWithItems } from "../types/purchase.type"
import PurchaseDetailDialog from "./purchase-detail-dialog.component"
import PurchaseFormDialog from "./purchase-form-dialog.component"
import PurchaseTable from "./purchase-table.component"

export default function PurchasesManager() {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [detailPurchase, setDetailPurchase] = useState<PurchaseWithItems | null>(null)

    const { data: purchases, isLoading } = useGetPurchases()

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Compras</h1>
                    <p className="text-sm text-muted-foreground">
                        Ingreso de mercadería: suma stock y actualiza el precio de compra del insumo.
                    </p>
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Nueva compra
                </Button>
            </div>

            {isLoading
                ? <Loader className="h-64" />
                : (
                    <PurchaseTable
                        purchases={purchases ?? []}
                        onShowDetail={setDetailPurchase}
                    />
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
