import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type CashMovement, type CreateCashMovementInput } from "../types/cash-movement.type"

const createCashMovement = async (
    { cash_session_id, ...values }: CreateCashMovementInput,
): Promise<CashMovement> => {
    const response = await fetch(`/api/cash-sessions/${cash_session_id}/movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function usePostCashMovement() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createCashMovement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cash-session"] })
            queryClient.invalidateQueries({ queryKey: ["cash-sessions"] })
        },
    })
}
