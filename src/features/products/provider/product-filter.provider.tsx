"use client"
import { createContext, useCallback, useContext, useState } from "react"

export interface ProductFilter {
    search: string
    category?: {
        id: number,
        subCategory?: number
    }
}

interface ProductContextType {
    filter: ProductFilter
    setFilter: (filter: Partial<ProductFilter>) => void
}

const ProductContext = createContext<ProductContextType>({
    filter: {
        search: "",
    },
    setFilter: () => { }
})

export const useProductFilterContext = () => useContext(ProductContext)

export default function ProductFilterProvider({ children }: { children: React.ReactNode }) {
    const [filter, setFilter] = useState<ProductFilter>({
        search: "",
        category: undefined
    })

    const handleSetFilter = useCallback((filter?: Partial<ProductFilter>) => {
        if (!filter) return setFilter({ search: "" })
        setFilter(prev => ({ ...prev, ...filter }))
    }, [])

    return (
        <ProductContext.Provider value={{
            filter,
            setFilter: handleSetFilter
        }}>
            {children}
        </ProductContext.Provider>
    )
}