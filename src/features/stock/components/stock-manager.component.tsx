"use client"

import { useState } from "react"
import { Loader } from "@/shared/components/loader.component"
import useGetSupplyStock from "../hooks/useGetSupplyStock.hook"
import { type StockFilter, type SupplyStock } from "../types/stock.type"
import StockFilters from "./stock-filters.component"
import StockMovementFormDialog from "./stock-movement-form-dialog.component"
import StockMovementHistoryDialog from "./stock-movement-history-dialog.component"
import StockTable from "./stock-table.component"

const defaultFilter: StockFilter = {
    search: "",
    onlyBelowMinimum: false,
}

export default function StockManager() {
    const [filter, setFilter] = useState<StockFilter>(defaultFilter)
    const [historySupply, setHistorySupply] = useState<SupplyStock | null>(null)
    const [movementSupply, setMovementSupply] = useState<SupplyStock | null>(null)

    const { data: rows, isLoading } = useGetSupplyStock(filter)

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Stock</h1>
                <p className="text-sm text-muted-foreground">
                    Existencias por insumo: la suma de sus movimientos, con alerta de stock mínimo.
                </p>
            </div>

            <StockFilters
                filter={filter}
                onFilterChange={(next) => setFilter((current) => ({ ...current, ...next }))}
            />

            {isLoading
                ? <Loader className="h-64" />
                : (
                    <StockTable
                        rows={rows ?? []}
                        onShowHistory={setHistorySupply}
                        onRegisterMovement={setMovementSupply}
                    />
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
