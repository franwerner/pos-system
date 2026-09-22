import { cookies } from "next/headers"
import { SESSION_COOKIE_NAME } from "./session-cookie.config"
import type { SessionUser } from "./session-user.type"
import { SESSION_DURATION_SECONDS, verifySessionToken } from "./token"

export { SESSION_COOKIE_NAME }

export const getSessionUser = async (): Promise<SessionUser | null> => {
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value

    if (!token) return null

    return verifySessionToken(token)
}

export const setSessionCookie = async (token: string): Promise<void> => {
    (await cookies()).set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_DURATION_SECONDS,
    })
}

export const clearSessionCookie = async (): Promise<void> => {
    (await cookies()).set({
        name: SESSION_COOKIE_NAME,
        value: "",
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
    })
}
