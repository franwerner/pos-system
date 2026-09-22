import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE_NAME } from "@/server/auth/session-cookie.config"
import { verifySessionToken } from "@/server/auth/token"

const PUBLIC_PATHS = ["/login", "/api/auth/login"]

export async function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl

    if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next()

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const user = token ? await verifySessionToken(token) : null

    if (user) return NextResponse.next()

    if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 })
    }

    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", `${pathname}${search}`)

    return NextResponse.redirect(loginUrl)
}

export const config = {
    matcher: ["/pos/:path*", "/admin/:path*", "/api/:path*"],
}
