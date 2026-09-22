import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type CashSession, type CloseCashSessionInput } from "../types/cash-session.type"

const closeCashSession = async (
    { id, ...values }: CloseCashSessionInput,
): Promise<CashSession> => {
    const response = await fetch(`/api/cash-sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function usePatchCashSession() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: closeCashSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cash-session"] })
            queryClient.invalidateQueries({ queryKey: ["cash-sessions"] })
        },
    })
}
