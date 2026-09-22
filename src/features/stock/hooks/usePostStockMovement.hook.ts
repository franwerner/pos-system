import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type ManualMovementInput, type StockMovement } from "../types/stock.type"

const createStockMovement = async (input: ManualMovementInput): Promise<StockMovement> => {
    const response = await fetch("/api/stock/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function usePostStockMovement() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createStockMovement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supply-stock"] })
            queryClient.invalidateQueries({ queryKey: ["stock-movements"] })
        },
    })
}
