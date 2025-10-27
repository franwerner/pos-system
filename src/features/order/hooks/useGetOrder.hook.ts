import { useQuery } from "@tanstack/react-query"
import orderData from "../data/order.data"

export default function useGetOrder(orderId: number) {
    return useQuery({
        queryKey: ["order", orderId],
        queryFn: () => orderData
    })
}
