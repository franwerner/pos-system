import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type CompositionLineInput } from "../types/composition.type"

const fetchSupplyComposition = async (supplyId: number): Promise<CompositionLineInput[]> => {
    const response = await fetch(`/api/supplies/${supplyId}/composition`)

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetSupplyComposition(supplyId: number | null) {
    return useQuery({
        queryKey: ["supply-composition", supplyId],
        queryFn: () => fetchSupplyComposition(supplyId as number),
        enabled: supplyId !== null,
    })
}
