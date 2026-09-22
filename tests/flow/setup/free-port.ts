import { createServer } from "node:net"

const isPortFree = (port: number): Promise<boolean> =>
    new Promise((resolvePort) => {
        const probe = createServer()

        probe.once("error", () => resolvePort(false))
        probe.once("listening", () => probe.close(() => resolvePort(true)))
        probe.listen(port, "127.0.0.1")
    })

/** Los tests levantan su propio server: nunca reutilizan el puerto del dev server. */
export const findFreePort = async (preferred: number, attempts = 50): Promise<number> => {
    for (let port = preferred; port < preferred + attempts; port++) {
        if (await isPortFree(port)) return port
    }

    throw new Error(
        `No encontré un puerto libre entre ${preferred} y ${preferred + attempts - 1} para el server de los tests de flujo`,
    )
}
