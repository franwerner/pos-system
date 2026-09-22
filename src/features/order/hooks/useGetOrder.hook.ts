import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type Sale } from "../types/sale.type"

const fetchOrder = async (orderId: number): Promise<Sale | null> => {
    const response = await fetch(`/api/orders/${orderId}`)

    if (response.status === 404) return null
    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetOrder(saleId: number) {
    return useQuery({
        queryKey: ["sale", saleId],
        queryFn: () => fetchOrder(saleId),
    })
}
