import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type ProductFilter } from "../provider/product-filter.provider"
import { type Product } from "../types/product.type"

const fetchProducts = async (filter?: Partial<ProductFilter>): Promise<Product[]> => {
    const search = filter?.search?.trim()
    const categoryId = filter?.category?.subCategory ?? filter?.category?.id

    const params = new URLSearchParams()

    if (search) params.set("search", search)
    if (categoryId) params.set("categoryId", String(categoryId))

    const response = await fetch(`/api/products?${params}`)

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetProducts(filter?: Partial<ProductFilter>) {
    return useQuery({
        queryKey: [
            "products",
            filter?.search ?? "",
            filter?.category?.id ?? null,
            filter?.category?.subCategory ?? null,
        ],
        queryFn: () => fetchProducts(filter),
    })
}
