import { z } from "zod"
import { toPeriodDate } from "@/features/fixed-costs/services/resolvePeriod.service"
import { type FixedCost } from "@/features/fixed-costs/types/fixed-cost.type"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"

export const runtime = "nodejs"

const MONTH_PATTERN = /^\d{4}-\d{2}$/

const createFixedCostSchema = z.object({
    concept: z.string().trim().min(1, "El concepto es obligatorio"),
    amount: z.number().min(0, "El monto debe ser mayor o igual a 0"),
    period: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "El período debe tener el formato AAAA-MM-DD"),
})

export const GET = authenticatedRoute({}, async ({ request }): Promise<FixedCost[]> => {
    const month = request.nextUrl.searchParams.get("month")

    if (!month || !MONTH_PATTERN.test(month)) {
        throw new ApiError(400, "El mes debe tener el formato AAAA-MM")
    }

    const { data, error } = await getServerSupabase()
        .from("fixed_cost")
        .select("*")
        .eq("period", toPeriodDate(month))
        .order("concept")

    if (error) throw new Error(error.message)

    return data ?? []
})

export const POST = authenticatedRoute(
    { body: createFixedCostSchema },
    async ({ body }): Promise<FixedCost> => {
        const { data, error } = await getServerSupabase()
            .from("fixed_cost")
            .insert(body)
            .select("*")
            .single()

        if (error) throw new Error(error.message)

        return data
    },
)
