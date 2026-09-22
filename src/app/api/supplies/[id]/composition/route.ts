import { type CompositionLineInput } from "@/features/supplies/types/composition.type"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"

export const runtime = "nodejs"

export const GET = authenticatedRoute({}, async ({ params }): Promise<CompositionLineInput[]> => {
    const supplyId = Number(params.id)

    if (!Number.isInteger(supplyId)) throw new ApiError(400, "El id del insumo no es válido")

    const { data, error } = await getServerSupabase()
        .from("supply_component")
        .select("component_supply_id, quantity")
        .eq("parent_supply_id", supplyId)
        .order("id")

    if (error) throw new Error(error.message)

    return (data ?? []).map((line) => ({
        supply_id: line.component_supply_id,
        quantity: line.quantity,
    }))
})
