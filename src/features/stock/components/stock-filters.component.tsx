"use client"

import { useEffect, useState } from "react"
import { FilterBar } from "@/shared/components/filter-bar.component"
import { type StockFilter } from "../types/stock.type"

interface StockFiltersProps {
    filter: StockFilter
    onFilterChange: (filter: Partial<StockFilter>) => void
}

export default function StockFilters({ filter, onFilterChange }: StockFiltersProps) {
    const [search, setSearch] = useState(filter.search)

    useEffect(() => {
        const timeout = setTimeout(() => onFilterChange({ search }), 400)
        return () => clearTimeout(timeout)
    }, [search])

    return (
        <FilterBar
            id="stock"
            searchPlaceholder="Buscar insumos..."
            searchValue={search}
            onSearchChange={setSearch}
            switchLabel="Solo bajo mínimo"
            switchChecked={filter.onlyBelowMinimum}
            onSwitchChange={(onlyBelowMinimum) => onFilterChange({ onlyBelowMinimum })}
        />
    )
}
