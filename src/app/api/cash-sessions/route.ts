import { z } from "zod"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"
import {
    findOpenCashSession,
    listCashSessions,
} from "@/features/cash/server/cash-session.repository"
import { resolveDefaultEmployeeId } from "@/features/order/server/order.repository"

export const runtime = "nodejs"

const openCashSessionSchema = z.object({
    opening_amount: z.number().min(0, "El monto inicial debe ser 0 o mayor"),
    note: z.string().trim().max(500, "La nota es demasiado larga").nullable().default(null),
})

export const GET = authenticatedRoute({}, async ({ request }) =>
    request.nextUrl.searchParams.get("status") === "open"
        ? findOpenCashSession()
        : listCashSessions())

export const POST = authenticatedRoute({ body: openCashSessionSchema }, async ({ body }) => {
    if (await findOpenCashSession()) {
        throw new ApiError(409, "Ya hay una caja abierta: cerrala antes de abrir otra")
    }

    const { data, error } = await getServerSupabase()
        .from("cash_session")
        .insert({ ...body, employee_id: await resolveDefaultEmployeeId() })
        .select("*")
        .single()

    if (error) throw new Error(error.message)

    return data
})
