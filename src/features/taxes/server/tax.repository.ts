import { getServerSupabase } from "@/server/supabase"
import { type Tax } from "../types/tax.type"

export const listTaxes = async (activeOnly: boolean): Promise<Tax[]> => {
    const query = getServerSupabase().from("tax").select("*").order("id")

    if (activeOnly) query.eq("is_active", true)

    const { data, error } = await query

    if (error) throw new Error(error.message)

    return (data ?? []) as Tax[]
}
