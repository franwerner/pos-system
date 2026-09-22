import { getServerSupabase } from "@/server/supabase"
import { type CashMovement, type CreateCashMovementInput } from "../types/cash-movement.type"

export const listCashMovements = async (cashSessionId: number): Promise<CashMovement[]> => {
    const { data, error } = await getServerSupabase()
        .from("cash_movement")
        .select("*")
        .eq("cash_session_id", cashSessionId)
        .order("created_at", { ascending: true })

    if (error) throw new Error(error.message)

    return (data ?? []) as CashMovement[]
}

export const insertCashMovement = async (input: CreateCashMovementInput): Promise<CashMovement> => {
    const { data, error } = await getServerSupabase()
        .from("cash_movement")
        .insert(input)
        .select("*")
        .single()

    if (error) throw new Error(error.message)

    return data as CashMovement
}
