import { type CompositionLineInput } from "@/features/supplies/types/composition.type"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"

export const runtime = "nodejs"

export const GET = authenticatedRoute({}, async ({ params }): Promise<CompositionLineInput[]> => {
    const productId = Number(params.id)

    if (!Number.isInteger(productId)) throw new ApiError(400, "El id del producto no es válido")

    const { data, error } = await getServerSupabase()
        .from("product_supply")
        .select("supply_id, quantity")
        .eq("product_id", productId)
        .order("id")

    if (error) throw new Error(error.message)

    return data ?? []
})
