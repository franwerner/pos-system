import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type ProductionComponent } from "../types/production.type"

const fetchProductionComponents = async (supplyId: number): Promise<ProductionComponent[]> => {
    const response = await fetch(`/api/production/components?supplyId=${supplyId}`)

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetProductionComponents(supplyId: number | null) {
    return useQuery({
        queryKey: ["production-components", supplyId],
        queryFn: () => fetchProductionComponents(supplyId as number),
        enabled: supplyId !== null,
    })
}
