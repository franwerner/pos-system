"use client"

import { cn } from "@/shared/utils/cn.util"
import { useGetCategories } from "../hooks/useGetCategories.hook"
import { useProductFilterContext } from "../provider/product-filter.provider"

interface ChipProps {
    label: string
    active: boolean
    onClick: () => void
}

function Chip({ label, active, onClick }: ChipProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-current={active ? "true" : undefined}
            className={cn(
                "min-h-12 shrink-0 whitespace-nowrap rounded-xl border-[1.5px] px-3.5 text-base font-semibold",
                active ? "border-brand bg-accent text-accent-foreground" : "border-border bg-card text-foreground",
            )}
        >
            {label}
        </button>
    )
}

/**
 * Categorías como chips en una fila (tablet vertical, sin espacio para el sidebar).
 * Padres y subcategorías van todos en la misma fila, en orden, sin ocultar nada
 * detrás de una selección previa (igual que el diseño).
 */
export default function CategoryChips({ className }: { className?: string }) {
    const { filter, setFilter } = useProductFilterContext()
    const { data: categories } = useGetCategories()

    return (
        <nav aria-label="Categorías" className={cn("flex gap-2 overflow-x-auto border-b border-border bg-card px-[18px] py-3", className)}>
            <Chip label="Todos" active={!filter.category} onClick={() => setFilter({ category: undefined })} />
            {categories?.map((category) => (
                <div key={category.id} className="flex gap-2">
                    <Chip
                        label={category.name}
                        active={filter.category?.id === category.id && !filter.category.subCategory}
                        onClick={() => setFilter({ category: { id: category.id } })}
                    />
                    {category.subCategories?.map((sub) => (
                        <Chip
                            key={sub.id}
                            label={sub.name}
                            active={filter.category?.subCategory === sub.id}
                            onClick={() => setFilter({
                                category: { id: category.id, subCategory: filter.category?.subCategory === sub.id ? undefined : sub.id },
                            })}
                        />
                    ))}
                </div>
            ))}
        </nav>
    )
}
