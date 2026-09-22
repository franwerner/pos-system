import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type Order } from "../types/sale.type"

const cancelOrder = async (id: number): Promise<Order> => {
    const response = await fetch(`/api/orders/${id}/cancel`, { method: "POST" })

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useCancelOrder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: cancelOrder,
        onSuccess: (order) => {
            queryClient.invalidateQueries({ queryKey: ["orders"] })
            queryClient.invalidateQueries({ queryKey: ["sale", order.id] })
            queryClient.invalidateQueries({ queryKey: ["supply-stock"] })
            queryClient.invalidateQueries({ queryKey: ["stock-movements"] })
        },
    })
}
