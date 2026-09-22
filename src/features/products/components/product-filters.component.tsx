"use client"

import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Switch } from "@/shared/components/ui/switch"
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar productos..."
                    className="pl-8"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
            </div>

            <div className="flex items-center gap-2 sm:ml-auto">
                <Switch
                    id="only-active-products"
                    checked={filter.onlyActive}
                    onCheckedChange={(onlyActive) => onFilterChange({ onlyActive })}
                />
                <Label htmlFor="only-active-products" className="cursor-pointer">Solo activos</Label>
            </div>
        </div>
    )
}
