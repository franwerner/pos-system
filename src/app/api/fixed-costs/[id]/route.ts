import { z } from "zod"
import { type FixedCost } from "@/features/fixed-costs/types/fixed-cost.type"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"

export const runtime = "nodejs"

const patchFixedCostSchema = z.object({
    concept: z.string().trim().min(1, "El concepto es obligatorio").optional(),
    amount: z.number().min(0, "El monto debe ser mayor o igual a 0").optional(),
    period: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "El período debe tener el formato AAAA-MM-DD")
        .optional(),
})

const readId = (raw: string | string[] | undefined): number => {
    const id = Number(raw)

    if (!Number.isInteger(id)) throw new ApiError(400, "El id del costo fijo no es válido")

    return id
}

export const PATCH = authenticatedRoute(
    { body: patchFixedCostSchema },
    async ({ body, params }): Promise<FixedCost> => {
        const { data, error } = await getServerSupabase()
            .from("fixed_cost")
            .update(body)
            .eq("id", readId(params.id))
            .select("*")
            .maybeSingle()

        if (error) throw new Error(error.message)
        if (!data) throw new ApiError(404, "El costo fijo no existe")

        return data
    },
)

export const DELETE = authenticatedRoute({}, async ({ params }) => {
    const id = readId(params.id)

    const { error } = await getServerSupabase()
        .from("fixed_cost")
        .delete()
        .eq("id", id)

    if (error) throw new Error(error.message)

    return { id }
})
