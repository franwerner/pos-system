import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type FixedCost } from "../types/fixed-cost.type"

const fetchFixedCosts = async (month: string): Promise<FixedCost[]> => {
    const response = await fetch(`/api/fixed-costs?month=${month}`)

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetFixedCosts(month: string) {
    return useQuery({
        queryKey: ["fixed-costs", month],
        queryFn: () => fetchFixedCosts(month),
    })
}
