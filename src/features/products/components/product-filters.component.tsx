"use client"

import { useEffect, useState } from "react"
import { FilterBar } from "@/shared/components/filter-bar.component"
import { type AdminProductFilter } from "../types/admin-product.type"

interface ProductFiltersProps {
    filter: AdminProductFilter
    onFilterChange: (filter: Partial<AdminProductFilter>) => void
}

export default function ProductFilters({ filter, onFilterChange }: ProductFiltersProps) {
    const [search, setSearch] = useState(filter.search)

    useEffect(() => {
        const timeout = setTimeout(() => onFilterChange({ search }), 400)
        return () => clearTimeout(timeout)
    }, [search])

    return (
        <FilterBar
            searchPlaceholder="Buscar productos..."
            searchValue={search}
            onSearchChange={setSearch}
            switchLabel="Solo activos"
            switchChecked={filter.onlyActive}
            onSwitchChange={(onlyActive) => onFilterChange({ onlyActive })}
            id="productos"
        />
    )
}
