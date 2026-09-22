import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type StockFilter, type SupplyStock } from "../types/stock.type"

const fetchSupplyStock = async (filter?: Partial<StockFilter>): Promise<SupplyStock[]> => {
    const params = new URLSearchParams()
    const search = filter?.search?.trim()

    if (search) params.set("search", search)
    if (filter?.onlyBelowMinimum) params.set("onlyBelowMinimum", "true")

    const response = await fetch(`/api/stock?${params}`)

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetSupplyStock(filter?: Partial<StockFilter>) {
    return useQuery({
        queryKey: [
            "supply-stock",
            filter?.search ?? "",
            filter?.onlyBelowMinimum ?? false,
        ],
        queryFn: () => fetchSupplyStock(filter),
    })
}
