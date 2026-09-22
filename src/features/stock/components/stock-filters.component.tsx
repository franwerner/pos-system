"use client"

import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Switch } from "@/shared/components/ui/switch"
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

            <div className="flex items-center gap-2 sm:ml-auto">
                <Switch
                    id="only-below-minimum"
                    checked={filter.onlyBelowMinimum}
                    onCheckedChange={(onlyBelowMinimum) => onFilterChange({ onlyBelowMinimum })}
                />
                <Label htmlFor="only-below-minimum" className="cursor-pointer">Solo bajo mínimo</Label>
            </div>
        </div>
    )
}
