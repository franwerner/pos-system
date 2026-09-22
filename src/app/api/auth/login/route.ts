import { z } from "zod"
import { ApiError } from "@/server/api/api-error"
import { publicRoute } from "@/server/api/handler"
import { verifyPassword } from "@/server/auth/password"
import { setSessionCookie } from "@/server/auth/session"
import { signSessionToken } from "@/server/auth/token"
import { getServerSupabase } from "@/server/supabase"

export const runtime = "nodejs"

const loginSchema = z.object({
    username: z.string().trim().min(1, "El usuario es obligatorio"),
    password: z.string().min(1, "La contraseña es obligatoria"),
})

// Mismo mensaje para usuario inexistente y contraseña incorrecta: quien prueba
// credenciales no puede deducir qué usuarios existen.
const INVALID_CREDENTIALS = "Usuario o contraseña incorrectos"

export const POST = publicRoute({ body: loginSchema }, async ({ body }) => {
    const { data, error } = await getServerSupabase()
        .from("app_user")
        .select("id, username, password_hash")
        .eq("username", body.username)
        .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) throw new ApiError(401, INVALID_CREDENTIALS)

    const isValid = await verifyPassword(body.password, data.password_hash)

    if (!isValid) throw new ApiError(401, INVALID_CREDENTIALS)

    const user = { id: data.id, username: data.username }

    await setSessionCookie(await signSessionToken(user))

    return { user }
})
