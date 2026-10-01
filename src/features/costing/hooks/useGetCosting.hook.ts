import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type CostingReport } from "../types/costing.type"

const fetchCosting = async (month: string): Promise<CostingReport> => {
    const response = await fetch(`/api/costing?month=${month}`)

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetCosting(month: string) {
    return useQuery({
        queryKey: ["costing", "report", month],
        queryFn: () => fetchCosting(month),
    })
}
