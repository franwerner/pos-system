"use client"

import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import { Input } from "@/shared/components/ui/input"
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

export default function SupplyFilters({ filter, onFilterChange }: SupplyFiltersProps) {
    const [search, setSearch] = useState(filter.search)

    useEffect(() => {
        const timeout = setTimeout(() => onFilterChange({ search }), 400)
        return () => clearTimeout(timeout)
    }, [search])

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar insumos..."
                    className="pl-8"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
            </div>

            <Select
                value={filter.type}
                onValueChange={(type) => onFilterChange({ type: type as SupplyFilter["type"] })}>
                <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Tipo" />
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

            <div className="flex items-center gap-2 sm:ml-auto">
                <Switch
                    id="only-active"
                    checked={filter.onlyActive}
                    onCheckedChange={(onlyActive) => onFilterChange({ onlyActive })}
                />
                <Label htmlFor="only-active" className="cursor-pointer">Solo activos</Label>
            </div>
        </div>
    )
}
