"use client"
import { createContext, useCallback, useContext, useState } from "react"

export interface ProductFilter {
    search: string
    category: string
}

interface ProductContextType {
    filter: ProductFilter
    setFilter: (filter: Partial<ProductFilter>) => void
}

const ProductContext = createContext<ProductContextType>({
    filter: {
        search: "",
        category: ""
    },
    setFilter: () => { }
})

export const useProductFilterContext = () => useContext(ProductContext)

export default function ProductFilterProvider({ children }: { children: React.ReactNode }) {
    const [filter, setFilter] = useState({
        search: "",
        category: ""
    })

    const handleSetFilter = useCallback((filter?: Partial<ProductFilter>) => {
        if (!filter) return setFilter({ search: "", category: "" })
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