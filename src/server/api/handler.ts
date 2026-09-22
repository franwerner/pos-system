import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/server/auth/session"
import type { SessionUser } from "@/server/auth/session-user.type"
import { ApiError } from "./api-error"

type RouteParams = Record<string, string | string[]>

interface RouteContext {
    params: Promise<RouteParams>
}

export interface HandlerContext<TBody> {
    request: NextRequest
    params: RouteParams
    body: TBody
}

export interface AuthenticatedHandlerContext<TBody> extends HandlerContext<TBody> {
    user: SessionUser
}

export interface RouteOptions<TBody> {
    body?: z.ZodType<TBody>
}

type RouteHandler = (request: NextRequest, context?: RouteContext) => Promise<Response>

const toResponse = (result: unknown) =>
    result instanceof Response ? result : NextResponse.json(result ?? null)

const toErrorResponse = (error: unknown) => {
    if (error instanceof ApiError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
        return NextResponse.json({
            error: "Datos inválidos",
            details: error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
            })),
        }, { status: 400 })
    }

    console.error(error)

    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
}

const readBody = async <TBody>(request: NextRequest, schema: z.ZodType<TBody>): Promise<TBody> => {
    let payload: unknown

    try {
        payload = await request.json()
    } catch {
        throw new ApiError(400, "El cuerpo del pedido no es JSON válido")
    }

    return schema.parse(payload)
}

const buildContext = async <TBody>(
    request: NextRequest,
    context: RouteContext | undefined,
    options: RouteOptions<TBody>,
): Promise<HandlerContext<TBody>> => ({
    request,
    params: (await context?.params) ?? {},
    body: (options.body ? await readBody(request, options.body) : undefined) as TBody,
})

/** Route handler sin sesión: solo el login y lo que deba responder a cualquiera. */
export const publicRoute = <TBody = undefined>(
    options: RouteOptions<TBody>,
    handle: (context: HandlerContext<TBody>) => Promise<unknown>,
): RouteHandler =>
    async (request, context) => {
        try {
            return toResponse(await handle(await buildContext(request, context, options)))
        } catch (error) {
            return toErrorResponse(error)
        }
    }

/** Route handler con sesión obligatoria: 401 si la cookie falta o no verifica. */
export const authenticatedRoute = <TBody = undefined>(
    options: RouteOptions<TBody>,
    handle: (context: AuthenticatedHandlerContext<TBody>) => Promise<unknown>,
): RouteHandler =>
    async (request, context) => {
        try {
            const user = await getSessionUser()

            if (!user) throw new ApiError(401, "No hay sesión activa")

            const handlerContext = await buildContext(request, context, options)

            return toResponse(await handle({ ...handlerContext, user }))
        } catch (error) {
            return toErrorResponse(error)
        }
    }
