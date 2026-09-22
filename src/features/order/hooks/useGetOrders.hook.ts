import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type Order, type OrderStatus } from "../types/sale.type"

const fetchOrders = async (status?: OrderStatus): Promise<Order[]> => {
    const response = await fetch(status ? `/api/orders?status=${status}` : "/api/orders")

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetOrders(status?: OrderStatus) {
    return useQuery({
        queryKey: ["orders", status ?? "all"],
        queryFn: () => fetchOrders(status),
    })
}
