import { z } from "zod"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"
import { readCashSessionId } from "@/features/cash/server/cash-session.repository"

export const runtime = "nodejs"

const closeCashSessionSchema = z.object({
    counted_amount: z.number().min(0, "El monto contado debe ser 0 o mayor"),
    note: z.string().trim().max(500, "La nota es demasiado larga").nullable().default(null),
})

export const PATCH = authenticatedRoute({ body: closeCashSessionSchema }, async ({ params, body }) => {
    const { data, error } = await getServerSupabase()
        .from("cash_session")
        .update({
            closed_at: new Date().toISOString(),
            counted_amount: body.counted_amount,
            // La sesión tiene una sola nota: la del cierre solo pisa la de apertura si se escribió.
            ...(body.note ? { note: body.note } : {}),
        })
        .eq("id", readCashSessionId(params))
        .is("closed_at", null)
        .select("*")
        .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) throw new ApiError(409, "La caja no existe o ya está cerrada")

    return data
})
