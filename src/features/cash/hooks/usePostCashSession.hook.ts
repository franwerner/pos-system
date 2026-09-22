import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type CashSession, type OpenCashSessionInput } from "../types/cash-session.type"

const openCashSession = async (input: OpenCashSessionInput): Promise<CashSession> => {
    const response = await fetch("/api/cash-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function usePostCashSession() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: openCashSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cash-session"] })
            queryClient.invalidateQueries({ queryKey: ["cash-sessions"] })
        },
    })
}
