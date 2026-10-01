"use client"

import { useEffect, useState } from "react"
import { FilterBar } from "@/shared/components/filter-bar.component"
import { Label } from "@/shared/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select"
import { Switch } from "@/shared/components/ui/switch"
import { SUPPLY_TYPE_LABELS, SUPPLY_TYPES, type SupplyFilter } from "../types/supply.type"

interface SupplyFiltersProps {
    filter: SupplyFilter
    onFilterChange: (filter: Partial<SupplyFilter>) => void
}

// El diseño separa el buscador (izquierda, ancho fijo en escritorio) del tipo + "Solo
// activos" (a la derecha): por eso no se usa el switch embebido de `FilterBar`, ese va
// junto al buscador en otras vistas pero acá viaja con el selector de tipo.
export default function SupplyFilters({ filter, onFilterChange }: SupplyFiltersProps) {
    const [search, setSearch] = useState(filter.search)

    useEffect(() => {
        const timeout = setTimeout(() => onFilterChange({ search }), 400)
        return () => clearTimeout(timeout)
    }, [search])

    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="w-full md:w-[320px]">
                <FilterBar
                    id="insumos"
                    searchPlaceholder="Buscar insumos..."
                    searchValue={search}
                    onSearchChange={setSearch}
                />
            </div>
            <div className="flex items-center justify-between gap-3 md:justify-start md:gap-5">
                <Select
                    value={filter.type}
                    onValueChange={(type) => onFilterChange({ type: type as SupplyFilter["type"] })}>
                    <SelectTrigger aria-label="Tipo de insumo" className="h-11 w-[190px] md:h-10 md:w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        {SUPPLY_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                                {SUPPLY_TYPE_LABELS[type]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-2.5">
                    <Switch
                        id="insumos-activos"
                        checked={filter.onlyActive}
                        onCheckedChange={(onlyActive) => onFilterChange({ onlyActive })}
                    />
                    <Label htmlFor="insumos-activos" className="text-sm font-semibold">Solo activos</Label>
                </div>
            </div>
        </div>
    )
}
