import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type SupplyFilter, type SupplyWithCost } from "../types/supply.type"

const fetchSupplies = async (filter?: Partial<SupplyFilter>): Promise<SupplyWithCost[]> => {
    const params = new URLSearchParams()
    const search = filter?.search?.trim()

    if (search) params.set("search", search)
    if (filter?.type && filter.type !== "all") params.set("type", filter.type)
    if (filter?.onlyActive) params.set("onlyActive", "true")

    const response = await fetch(`/api/supplies?${params}`)

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetSupplies(filter?: Partial<SupplyFilter>) {
    return useQuery({
        queryKey: [
            "supplies",
            filter?.search ?? "",
            filter?.type ?? "all",
            filter?.onlyActive ?? false,
        ],
        queryFn: () => fetchSupplies(filter),
    })
}
