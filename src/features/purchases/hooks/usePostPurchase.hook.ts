import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type PurchaseInput } from "../types/purchase.type"

const createPurchase = async (input: PurchaseInput): Promise<number> => {
    const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    const { id } = await response.json()

    return id
}

export default function usePostPurchase() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createPurchase,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchases"] })
            queryClient.invalidateQueries({ queryKey: ["supply-stock"] })
            queryClient.invalidateQueries({ queryKey: ["stock-movements"] })
            queryClient.invalidateQueries({ queryKey: ["supplies"] })
            queryClient.invalidateQueries({ queryKey: ["costing"] })
        },
    })
}
