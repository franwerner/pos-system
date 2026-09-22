import { readApiError } from "@/features/auth/services/readApiError.service"
import { type CashSession } from "../types/cash-session.type"

export const fetchOpenCashSession = async (): Promise<CashSession | null> => {
    const response = await fetch("/api/cash-sessions?status=open")

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}
