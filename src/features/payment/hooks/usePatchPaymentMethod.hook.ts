import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type Payment, type PaymentMethodInput } from "../types/payment.type"

type PatchPaymentMethodInput = Partial<PaymentMethodInput> & { id: number }

const updatePaymentMethod = async (input: PatchPaymentMethodInput): Promise<Payment> => {
    const response = await fetch("/api/payment-methods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function usePatchPaymentMethod() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updatePaymentMethod,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
            queryClient.invalidateQueries({ queryKey: ["payments"] })
        },
    })
}
