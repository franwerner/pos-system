import { z } from "zod"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import {
    insertCashMovement,
    listCashMovements,
} from "@/features/cash/server/cash-movement.repository"
import {
    readCashSessionId,
    requireCashSession,
} from "@/features/cash/server/cash-session.repository"
import { CASH_MOVEMENT_TYPES } from "@/features/cash/types/cash-movement.type"

export const runtime = "nodejs"

const createCashMovementSchema = z.object({
    type: z.enum(CASH_MOVEMENT_TYPES),
    amount: z.number().positive("El monto debe ser mayor a 0"),
    // Sin concepto el arqueo no se puede auditar: no se sabe por qué entró o salió la plata.
    concept: z.string().trim().min(1, "El concepto es obligatorio").max(200, "El concepto es demasiado largo"),
})

export const GET = authenticatedRoute({}, async ({ params }) => {
    const sessionId = readCashSessionId(params)

    await requireCashSession(sessionId)

    return listCashMovements(sessionId)
})

export const POST = authenticatedRoute({ body: createCashMovementSchema }, async ({ params, body }) => {
    const sessionId = readCashSessionId(params)
    const session = await requireCashSession(sessionId)

    if (session.closed_at) {
        throw new ApiError(409, "La caja ya está cerrada: no admite movimientos")
    }

    return insertCashMovement({ ...body, cash_session_id: sessionId })
})
