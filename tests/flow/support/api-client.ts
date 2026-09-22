export type ApiResponse<T> = {
    status: number
    body: T
}

export type ApiClient = {
    /** Devuelve la respuesta cruda: para los casos donde el rechazo es lo que se verifica. */
    send: <T = unknown>(method: string, path: string, body?: unknown) => Promise<ApiResponse<T>>
    get: <T>(path: string) => Promise<T>
    post: <T>(path: string, body?: unknown) => Promise<T>
    patch: <T>(path: string, body?: unknown) => Promise<T>
    delete: <T>(path: string, body?: unknown) => Promise<T>
}

const baseUrl = (): string => {
    const url = process.env.FLOW_BASE_URL

    if (!url) throw new Error("Falta FLOW_BASE_URL: los tests de flujo se corren con npm run test:flow")

    return url
}

const readCookie = (response: Response): string => {
    const header = response.headers.getSetCookie().at(0)

    if (!header) throw new Error("El login no devolvió la cookie de sesión")

    return header.split(";")[0]
}

const send = async <T>(
    cookie: string | null,
    method: string,
    path: string,
    body?: unknown,
): Promise<ApiResponse<T>> => {
    const response = await fetch(`${baseUrl()}${path}`, {
        method,
        headers: {
            ...(body === undefined ? {} : { "content-type": "application/json" }),
            ...(cookie ? { cookie } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    })

    const text = await response.text()

    return { status: response.status, body: (text ? JSON.parse(text) : null) as T }
}

const expectOk = <T>(method: string, path: string, response: ApiResponse<T>): T => {
    if (response.status >= 400) {
        throw new Error(`${method} ${path} respondió ${response.status}: ${JSON.stringify(response.body)}`)
    }

    return response.body
}

const buildClient = (cookie: string | null): ApiClient => ({
    send: (method, path, body) => send(cookie, method, path, body),
    get: async (path) => expectOk("GET", path, await send(cookie, "GET", path)),
    post: async (path, body) => expectOk("POST", path, await send(cookie, "POST", path, body)),
    patch: async (path, body) => expectOk("PATCH", path, await send(cookie, "PATCH", path, body)),
    delete: async (path, body) => expectOk("DELETE", path, await send(cookie, "DELETE", path, body)),
})

/** Cliente sin cookie: lo que ve alguien que llama a la API sin haberse logueado. */
export const createAnonymousClient = (): ApiClient => buildClient(null)

export const createAuthenticatedClient = async (): Promise<ApiClient> => {
    const username = process.env.FLOW_ADMIN_USERNAME
    const password = process.env.FLOW_ADMIN_PASSWORD

    const response = await fetch(`${baseUrl()}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
        throw new Error(`El login del usuario de prueba falló con ${response.status}: ${await response.text()}`)
    }

    return buildClient(readCookie(response))
}
