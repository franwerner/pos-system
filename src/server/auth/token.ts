import { SignJWT, jwtVerify } from "jose"
import type { SessionUser } from "./session-user.type"

export const SESSION_DURATION_SECONDS = 8 * 60 * 60

const ALGORITHM = "HS256"

// Leído en cada llamada y no al importar: el módulo se carga en el edge runtime
// del middleware, donde las variables de entorno llegan después del import.
const getSecret = () => {
    const secret = process.env.AUTH_JWT_SECRET

    if (!secret) throw new Error("Falta AUTH_JWT_SECRET")

    return new TextEncoder().encode(secret)
}

export const signSessionToken = async (user: SessionUser): Promise<string> => {
    const issuedAt = Math.floor(Date.now() / 1000)

    return new SignJWT({ username: user.username })
        .setProtectedHeader({ alg: ALGORITHM })
        .setSubject(String(user.id))
        .setIssuedAt(issuedAt)
        .setExpirationTime(issuedAt + SESSION_DURATION_SECONDS)
        .sign(getSecret())
}

export const verifySessionToken = async (token: string): Promise<SessionUser | null> => {
    try {
        const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALGORITHM] })

        const id = Number(payload.sub)
        const username = payload.username

        if (!Number.isInteger(id) || typeof username !== "string" || username.length === 0) return null

        return { id, username }
    } catch {
        return null
    }
}
