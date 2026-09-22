import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type AdminProduct, type AdminProductFilter } from "../types/admin-product.type"

const fetchAdminProducts = async (filter?: Partial<AdminProductFilter>): Promise<AdminProduct[]> => {
    const params = new URLSearchParams({ view: "admin" })
    const search = filter?.search?.trim()

    if (search) params.set("search", search)
    if (filter?.onlyActive) params.set("onlyActive", "true")

    const response = await fetch(`/api/products?${params}`)

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetAdminProducts(filter?: Partial<AdminProductFilter>) {
    return useQuery({
        queryKey: [
            "admin-products",
            filter?.search ?? "",
            filter?.onlyActive ?? false,
        ],
        queryFn: () => fetchAdminProducts(filter),
    })
}
