"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/components/ui/accordion"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuSub, SidebarMenuSubItem } from "@/shared/components/ui/sidebar"
import { cn } from "@/shared/utils/cn.util"
import { memo, useCallback } from "react"
import { useGetCategories } from "../hooks/useGetCategories.hook"
import { useProductFilterContext } from "../provider/product-filter.provider"
import { Category, CategoryWithoutSubCategories } from "../types/category.type"

interface CategoryItemProps {
  item: Category
  categoryFilter?: { id: number, subCategory?: number }
  setCategoryFilter: (category?: { id: number, subCategory?: number }) => void
}

interface SubCategoryItemProps {
  item: CategoryWithoutSubCategories
  isSelected: boolean
  setCategoryFilter: CategoryItemProps['setCategoryFilter']
}

const SubCategoryItem = memo(({ item, isSelected, setCategoryFilter }: SubCategoryItemProps) => {
  return (
    <SidebarMenuSubItem
      key={item.id}
      onClick={() => setCategoryFilter({ id: item.parent_id!, subCategory: isSelected ? undefined : item.id })}
      className={cn(
        "relative flex items-center gap-2 rounded-md transition-all duration-100 p-2 cursor-pointer text-sm",
        "",
        isSelected && "bg-indigo-50 text-semibold text-indigo-700",
        !isSelected && "hover:bg-accent/70 hover:text-accent-foreground"
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full transition-all text-me duration-300",
          isSelected ? "bg-indigo-400 scale-100" : "bg-indigo-900 scale-75"
        )}
      />
      <span className={cn(
        "truncate",
        isSelected && "font-semibold"
      )}>{item.name}</span>
    </SidebarMenuSubItem>
  )
})

const CategoryGroup = memo(({ item, categoryFilter, setCategoryFilter }: CategoryItemProps) => {
  const isSelected = !!categoryFilter
  const subCategories = item.subCategories || []

  return (
    <SidebarMenu>
      <AccordionItem
        value={item.id.toString()}
        className="px-3 py-3">
        <AccordionTrigger
          onClick={() => {
            setCategoryFilter(isSelected ? undefined : { id: item.id })
          }}
          className="p-2 cursor-pointer " >
          <span className={cn(
            "font-medium",
            isSelected && "font-semibold text-indigo-700"
          )}>{item.name}</span>
        </AccordionTrigger>
        <AccordionContent className="overflow-hidden pl-2">
          <SidebarMenuSub className="gap-1 flex flex-col border-l border-border/50 pl-3 mt-2">
            {subCategories.map((subCategory) => (
              <SubCategoryItem
                key={subCategory.id}
                item={subCategory}
                isSelected={categoryFilter?.subCategory === subCategory.id}
                setCategoryFilter={setCategoryFilter}
              />
            ))}
          </SidebarMenuSub>
        </AccordionContent>
      </AccordionItem>
    </SidebarMenu>
  )
})


export default function CategorySidebar() {
  const { filter, setFilter } = useProductFilterContext()

  const categories = useGetCategories()

  const categoriesData = categories.data

  const setCategoryFilter = useCallback((category?: { id: number, subCategory?: number }) => {
    setFilter({
      category
    })
  }, [])

  return (
    <Sidebar>
      <SidebarHeader>
        <h2 className="text-xl p-3  font-bold text-start">Categorías</h2>
      </SidebarHeader>
      <SidebarContent>
        <Accordion
          type="single"
          defaultValue={filter.category?.id ? filter.category.id.toString() : undefined}
          collapsible>
          {
            categoriesData?.map((category) =>
              <CategoryGroup
                key={category.id}
                item={category}
                categoryFilter={filter.category?.id === category.id ? filter.category : undefined}
                setCategoryFilter={setCategoryFilter}
              />
            )
          }
        </Accordion>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
