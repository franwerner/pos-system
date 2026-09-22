import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type Payment } from "../types/payment.type"

const fetchPaymentMethods = async (): Promise<Payment[]> => {
    const response = await fetch("/api/payment-methods")

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetPaymentMethods() {
    return useQuery({
        queryKey: ["payment-methods"],
        queryFn: fetchPaymentMethods,
    })
}
