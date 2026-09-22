import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type Payment, type PaymentMethodInput } from "../types/payment.type"

const createPaymentMethod = async (input: PaymentMethodInput): Promise<Payment> => {
    const response = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function usePostPaymentMethod() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createPaymentMethod,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
            queryClient.invalidateQueries({ queryKey: ["payments"] })
        },
    })
}
