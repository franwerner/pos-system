import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type Order, type PayOrderInput } from "../types/sale.type"

const payOrder = async ({ id, payments }: PayOrderInput): Promise<Order> => {
    const response = await fetch(`/api/orders/${id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payments }),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function usePayOrder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: payOrder,
        onSuccess: (order) => {
            queryClient.invalidateQueries({ queryKey: ["orders"] })
            queryClient.invalidateQueries({ queryKey: ["sale", order.id] })
            queryClient.invalidateQueries({ queryKey: ["cash-sessions"] })
        },
    })
}
