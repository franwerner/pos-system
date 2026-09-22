import { ApiError } from "@/server/api/api-error"
import { getServerSupabase } from "@/server/supabase"
import { type Tables } from "@/shared/types/database.types"

export type PaymentMethodRow = Tables<"payment_method">

export const listPaymentMethods = async (activeOnly: boolean): Promise<PaymentMethodRow[]> => {
    const query = getServerSupabase().from("payment_method").select("*").order("id")

    const { data, error } = activeOnly ? await query.eq("is_active", true) : await query

    if (error) throw new Error(error.message)

    return data ?? []
}

/** Los métodos que el cobro puede usar: inactivos quedan afuera para no seguir cobrándose. */
export const loadActivePaymentMethods = async (ids: number[]): Promise<PaymentMethodRow[]> => {
    const uniqueIds = [...new Set(ids)]

    const { data, error } = await getServerSupabase()
        .from("payment_method")
        .select("*")
        .in("id", uniqueIds)
        .eq("is_active", true)

    if (error) throw new Error(error.message)

    const found = data ?? []
    const missing = uniqueIds.filter((id) => !found.some((method) => method.id === id))

    if (missing.length > 0) {
        throw new ApiError(400, `El método de pago #${missing[0]} no existe o no está activo`)
    }

    return found
}
