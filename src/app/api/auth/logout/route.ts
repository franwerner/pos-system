import { authenticatedRoute } from "@/server/api/handler"
import { clearSessionCookie } from "@/server/auth/session"

export const runtime = "nodejs"

export const POST = authenticatedRoute({}, async () => {
    await clearSessionCookie()

    return { ok: true }
})
