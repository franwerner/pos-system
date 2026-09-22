import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type CreateOrderInput, type Order } from "../types/sale.type"

const createOrder = async (input: CreateOrderInput): Promise<Order> => {
    const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export const usePostOrder = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supply-stock"] })
            queryClient.invalidateQueries({ queryKey: ["stock-movements"] })
            queryClient.invalidateQueries({ queryKey: ["cash-sessions"] })
            queryClient.invalidateQueries({ queryKey: ["orders"] })
        },
    })
}
