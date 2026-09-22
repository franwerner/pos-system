import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type CashSessionWithPayments } from "../types/cash-session.type"

const fetchCashSessions = async (): Promise<CashSessionWithPayments[]> => {
    const response = await fetch("/api/cash-sessions")

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetCashSessions() {
    return useQuery({
        queryKey: ["cash-sessions"],
        queryFn: fetchCashSessions,
    })
}
