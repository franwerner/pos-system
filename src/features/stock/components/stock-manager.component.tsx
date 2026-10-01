"use client"

import { CircleCheck, Search } from "lucide-react"
import { type ReactNode, useState } from "react"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { EmptyState } from "@/shared/components/empty-state.component"
import { PageHeader } from "@/shared/components/page-header.component"
import { TableSkeleton } from "@/shared/components/table-skeleton.component"
import useGetSupplyStock from "../hooks/useGetSupplyStock.hook"
import { type StockFilter, type SupplyStock } from "../types/stock.type"
import StockCards from "./stock-cards.component"
import StockFilters from "./stock-filters.component"
import StockMovementFormDialog from "./stock-movement-form-dialog.component"
import StockMovementHistoryDialog from "./stock-movement-history-dialog.component"
import StockTable from "./stock-table.component"

const defaultFilter: StockFilter = {
    search: "",
    onlyBelowMinimum: false,
}

const STOCK_TABLE_HEADERS = ["Insumo", "Unidad", "Stock actual", "Stock mínimo", "Acciones"]

/** Estado "Cargando": encabezados reales (tabla) o tarjetas de Skeleton (celular). */
function StockLoading() {
    return (
        <>
            <div className="hidden md:block">
                <TableSkeleton
                    headers={STOCK_TABLE_HEADERS}
                    rows={7}
                    widths={["w-[200px]", "w-[50px]", "w-20", "w-20", "w-[260px]"]}
                />
            </div>
            <div className="flex flex-col gap-4 md:hidden" aria-busy="true" aria-label="Cargando">
                {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-3.5">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-[22px] w-[60px]" />
                        </div>
                        <Skeleton className="h-9 w-4/5" />
                    </div>
                ))}
            </div>
        </>
    )
}

/** Escritorio: el vacío va dentro de una tarjeta con padding. Celular: solo el recuadro punteado. */
function EmptyCard({ children }: { children: ReactNode }) {
    return <div className="md:rounded-xl md:border md:border-border md:bg-card md:p-5 md:shadow-sm">{children}</div>
}

export default function StockManager() {
    const [filter, setFilter] = useState<StockFilter>(defaultFilter)
    const [historySupply, setHistorySupply] = useState<SupplyStock | null>(null)
    const [movementSupply, setMovementSupply] = useState<SupplyStock | null>(null)

    const { data: rows, isLoading } = useGetSupplyStock(filter)

    // Sin coincidencias con "Solo bajo mínimo" prendido y sin búsqueda: es una buena noticia
    // (ningún insumo está mal), no un callejón sin salida como cuando el buscador no encuentra
    // nada. Dos avisos distintos, como en el diseño (ver states.tsx del export).
    const isFilteredAllClear = (rows ?? []).length === 0 && filter.onlyBelowMinimum && filter.search.trim() === ""

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Stock"
                description="Existencias por insumo: la suma de sus movimientos, con alerta de stock mínimo."
            />

            <StockFilters
                filter={filter}
                onFilterChange={(next) => setFilter((current) => ({ ...current, ...next }))}
            />

            {isLoading ? (
                <StockLoading />
            ) : (rows ?? []).length === 0 ? (
                <EmptyCard>
                    {isFilteredAllClear ? (
                        <EmptyState
                            icon={CircleCheck}
                            title="No hay insumos que coincidan con el filtro."
                            description="Ningún insumo está por debajo de su stock mínimo."
                        />
                    ) : (
                        <EmptyState
                            icon={Search}
                            title="No hay insumos que coincidan con el filtro."
                            description="Probá con otro nombre o apagá “Solo bajo mínimo”."
                        />
                    )}
                </EmptyCard>
            ) : (
                <>
                    <StockTable
                        rows={rows ?? []}
                        onShowHistory={setHistorySupply}
                        onRegisterMovement={setMovementSupply}
                    />
                    <StockCards
                        rows={rows ?? []}
                        onShowHistory={setHistorySupply}
                        onRegisterMovement={setMovementSupply}
                    />
                </>
            )}

            <StockMovementHistoryDialog
                open={!!historySupply}
                onOpenChange={(open) => !open && setHistorySupply(null)}
                supplyStock={historySupply}
            />

            <StockMovementFormDialog
                open={!!movementSupply}
                onOpenChange={(open) => !open && setMovementSupply(null)}
                supplyStock={movementSupply}
            />
        </div>
    )
}
