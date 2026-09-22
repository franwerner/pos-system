const DEFAULT_MESSAGE = "No se pudo completar el pedido"

export const readApiError = async (response: Response): Promise<string> => {
    try {
        const payload = await response.json()

        return typeof payload?.error === "string" ? payload.error : DEFAULT_MESSAGE
    } catch {
        return DEFAULT_MESSAGE
    }
}
