"use client"

import { LayoutGrid } from "lucide-react"
import { memo, useCallback } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/components/ui/accordion"
import { cn } from "@/shared/utils/cn.util"
import { useGetCategories } from "../hooks/useGetCategories.hook"
import { useProductFilterContext } from "../provider/product-filter.provider"
import { type Category, type CategoryWithoutSubCategories } from "../types/category.type"

interface SubCategoryItemProps {
    item: CategoryWithoutSubCategories
    isSelected: boolean
    onSelect: () => void
}

const SubCategoryItem = memo(({ item, isSelected, onSelect }: SubCategoryItemProps) => (
    <button
        type="button"
        onClick={onSelect}
        aria-current={isSelected ? "true" : undefined}
        className={cn(
            "flex min-h-[46px] w-full items-center gap-2.5 rounded-xl border-[1.5px] border-transparent pl-10 pr-3.5 text-left text-[15px] font-medium text-muted-foreground",
            isSelected && "border-brand bg-accent text-accent-foreground",
        )}
    >
        <span className="truncate">{item.name}</span>
    </button>
))
SubCategoryItem.displayName = "SubCategoryItem"

interface CategoryGroupProps {
    item: Category
    activeId?: number
    activeSubId?: number
    onSelectParent: (id: number) => void
    onSelectSub: (parentId: number, subId?: number) => void
}

const CategoryGroup = memo(({ item, activeId, activeSubId, onSelectParent, onSelectSub }: CategoryGroupProps) => {
    const subCategories = item.subCategories ?? []
    const isActive = activeId === item.id && !activeSubId

    return (
        <AccordionItem value={item.id.toString()} className="border-b-0">
            <AccordionTrigger
                onClick={() => onSelectParent(item.id)}
                className={cn(
                    "min-h-[52px] rounded-xl border-[1.5px] border-transparent px-3.5 text-base font-semibold text-foreground hover:bg-transparent hover:text-foreground",
                    isActive && "border-brand bg-accent text-accent-foreground",
                )}
            >
                <span className="flex-1">{item.name}</span>
            </AccordionTrigger>
            {subCategories.length > 0 && (
                <AccordionContent className="pl-2">
                    <div className="mt-1 flex flex-col gap-1 border-l border-border/50 pl-3">
                        {subCategories.map((sub) => (
                            <SubCategoryItem
                                key={sub.id}
                                item={sub}
                                isSelected={activeId === item.id && activeSubId === sub.id}
                                onSelect={() => onSelectSub(item.id, activeSubId === sub.id ? undefined : sub.id)}
                            />
                        ))}
                    </div>
                </AccordionContent>
            )}
        </AccordionItem>
    )
})
CategoryGroup.displayName = "CategoryGroup"

/** Sidebar de categorías del POS (tablet horizontal): "Todos" + acordeón padre → subcategorías. */
export default function CategorySidebar({ className }: { className?: string }) {
    const { filter, setFilter } = useProductFilterContext()
    const { data: categories } = useGetCategories()

    const selectAll = useCallback(() => setFilter({ category: undefined }), [setFilter])
    const selectParent = useCallback(
        (id: number) => setFilter({ category: filter.category?.id === id && !filter.category.subCategory ? undefined : { id } }),
        [filter.category, setFilter],
    )
    const selectSub = useCallback(
        (parentId: number, subId?: number) => setFilter({ category: { id: parentId, subCategory: subId } }),
        [setFilter],
    )

    return (
        <nav
            aria-label="Categorías"
            className={cn("flex w-[210px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-card px-2.5 py-3.5", className)}
        >
            <button
                type="button"
                onClick={selectAll}
                aria-current={!filter.category ? "true" : undefined}
                className={cn(
                    "flex min-h-[52px] w-full items-center gap-2.5 rounded-xl border-[1.5px] border-transparent px-3.5 text-left text-base font-semibold text-foreground",
                    !filter.category && "border-brand bg-accent text-accent-foreground",
                )}
            >
                <LayoutGrid className="size-5" aria-hidden />
                <span className="flex-1">Todos</span>
            </button>
            {categories && (
                // "multiple": el diseño muestra más de un padre abierto a la vez (ej. Comidas y
                // Bebidas juntas); por defecto arrancan todas abiertas para no esconder
                // subcategorías detrás de un tap extra.
                <Accordion type="multiple" defaultValue={categories.map((category) => category.id.toString())}>
                    {categories.map((category) => (
                        <CategoryGroup
                            key={category.id}
                            item={category}
                            activeId={filter.category?.id}
                            activeSubId={filter.category?.subCategory}
                            onSelectParent={selectParent}
                            onSelectSub={selectSub}
                        />
                    ))}
                </Accordion>
            )}
        </nav>
    )
}
