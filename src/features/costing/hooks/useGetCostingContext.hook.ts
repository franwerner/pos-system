import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type CostingContext } from "../types/costing.type"

const fetchCostingContext = async (): Promise<CostingContext> => {
    const response = await fetch("/api/costing/context")

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetCostingContext() {
    return useQuery({
        queryKey: ["costing", "context"],
        queryFn: fetchCostingContext,
    })
}
