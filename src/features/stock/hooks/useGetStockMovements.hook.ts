import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type StockMovement } from "../types/stock.type"

const fetchStockMovements = async (supplyId: number): Promise<StockMovement[]> => {
    const response = await fetch(`/api/stock/movements?supplyId=${supplyId}`)

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetStockMovements(supplyId: number | null) {
    return useQuery({
        queryKey: ["stock-movements", supplyId],
        queryFn: () => fetchStockMovements(supplyId as number),
        enabled: supplyId !== null,
    })
}
