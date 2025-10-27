"use client"
import { Input } from "@/shared/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useProductFilterContext } from "../provider/product-filter.provider";
import { cn } from "@/shared/utils/cn.util";

export default function SearchProduct({ className }: { className?: string }) {
    const { filter, setFilter } = useProductFilterContext()
    const [search, setSearch] = useState(filter.search)

    useEffect(() => {
        const timeout = setTimeout(() => {
            setFilter({ search })
        }, 500)
        return () => {
            clearTimeout(timeout)
        }
    }, [search])

    return (
        <div className={cn("relative w-full", className)}>
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Buscar productos..."
                className="pl-8"
                color=""
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
    )
}