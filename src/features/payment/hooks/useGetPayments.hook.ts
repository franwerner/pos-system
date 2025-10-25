import { useQuery } from "@tanstack/react-query"
import paymentsData from "../data/payments.data"

export const useGetPayments = () => {
    return useQuery({
        queryKey: ["payments"],
        queryFn: async () => {
            return paymentsData
        },
        staleTime: Infinity,
        gcTime: Infinity,
    })
}