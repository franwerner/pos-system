"use client"

import { ChefHat, Plus } from "lucide-react"
import { useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { EmptyState } from "@/shared/components/empty-state.component"
import { PageHeader } from "@/shared/components/page-header.component"
import { TableSkeleton } from "@/shared/components/table-skeleton.component"
import useGetProductions from "../hooks/useGetProductions.hook"
import { type ProductionWithDetail } from "../types/production.type"
import ProductionCards from "./production-cards.component"
import ProductionDetailDialog from "./production-detail-dialog.component"
import ProductionFormDialog from "./production-form-dialog.component"
import ProductionTable, { PRODUCTION_TABLE_HEADERS } from "./production-table.component"

/** Estado "Cargando": encabezados reales (tabla) o tarjetas de Skeleton (celular). */
function ProductionLoading() {
    return (
        <>
            <div className="hidden md:block">
                <TableSkeleton
                    headers={PRODUCTION_TABLE_HEADERS}
                    rows={4}
                    widths={["w-[60px]", "w-[90px]", "w-[30px]", "w-[60px]", "w-[60px]", "w-[60px]", "w-[60px]"]}
                />
            </div>
            <div className="flex flex-col gap-3 md:hidden" aria-busy="true" aria-label="Cargando">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[124px] rounded-xl" />)}
            </div>
        </>
    )
}

export default function ProductionManager() {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [detailProduction, setDetailProduction] = useState<ProductionWithDetail | null>(null)

    const { data: productions, isLoading } = useGetProductions()
    const rows = productions ?? []

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Producción"
                description="Preparados: consume los componentes, ingresa las unidades y deja su costo unitario."
                actions={
                    <Button size="lg" className="h-11 gap-2 md:h-10" onClick={() => setIsFormOpen(true)}>
                        <Plus className="size-5" aria-hidden />
                        Nueva producción
                    </Button>
                }
            />

            {isLoading ? (
                <ProductionLoading />
            ) : rows.length === 0 ? (
                <Card className="p-5">
                    <EmptyState
                        icon={ChefHat}
                        title="Todavía no hay producciones cargadas."
                        description="Registrá una tanda de un preparado (por ejemplo, milanesas crudas) para que su costo llegue a las recetas que lo usan."
                        action={
                            <Button className="h-11 gap-2 md:h-10" onClick={() => setIsFormOpen(true)}>
                                <Plus className="size-4" aria-hidden />
                                Nueva producción
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <>
                    <ProductionTable productions={rows} onShowDetail={setDetailProduction} />
                    <ProductionCards productions={rows} onShowDetail={setDetailProduction} />
                </>
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
