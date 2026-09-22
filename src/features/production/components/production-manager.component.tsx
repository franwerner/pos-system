"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { Loader } from "@/shared/components/loader.component"
import { Button } from "@/shared/components/ui/button"
import useGetProductions from "../hooks/useGetProductions.hook"
import { type ProductionWithDetail } from "../types/production.type"
import ProductionDetailDialog from "./production-detail-dialog.component"
import ProductionFormDialog from "./production-form-dialog.component"
import ProductionTable from "./production-table.component"

export default function ProductionManager() {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [detailProduction, setDetailProduction] = useState<ProductionWithDetail | null>(null)

    const { data: productions, isLoading } = useGetProductions()

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Producción</h1>
                    <p className="text-sm text-muted-foreground">
                        Preparados: consume los componentes, ingresa las unidades y deja su costo unitario.
                    </p>
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Nueva producción
                </Button>
            </div>

            {isLoading
                ? <Loader className="h-64" />
                : (
                    <ProductionTable
                        productions={productions ?? []}
                        onShowDetail={setDetailProduction}
                    />
                )}

            <ProductionFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />

            <ProductionDetailDialog
                open={!!detailProduction}
                onOpenChange={(open) => !open && setDetailProduction(null)}
                production={detailProduction}
            />
        </div>
    )
}
