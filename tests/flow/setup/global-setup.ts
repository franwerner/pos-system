import { spawn, type ChildProcess } from "node:child_process"
import { rmSync } from "node:fs"
import { resolve } from "node:path"

const ROOT = process.cwd()
const DIST_DIR = ".next-flow"
const READY_TIMEOUT_MS = 180_000
const READY_POLL_MS = 500
const STOP_TIMEOUT_MS = 10_000

const tail = (output: string, lines = 25): string =>
    output.split("\n").filter(Boolean).slice(-lines).join("\n")

const runSeed = (): Promise<void> =>
    new Promise((done, fail) => {
        const seed = spawn("npm", ["run", "seed"], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] })

        let output = ""

        seed.stdout.on("data", (chunk: Buffer) => { output += chunk.toString() })
        seed.stderr.on("data", (chunk: Buffer) => { output += chunk.toString() })

        seed.on("error", (error) => fail(new Error(`No pude ejecutar "npm run seed": ${error.message}`)))

        seed.on("close", (code) => {
            if (code === 0) return done()

            fail(new Error(`"npm run seed" falló con código ${code}:\n${tail(output)}`))
        })
    })

const startServer = (port: number): { server: ChildProcess; readOutput: () => string } => {
    // El dev server de los tests usa su propio directorio de build: con el del
    // desarrollador compartiría el lock de `next dev` y uno de los dos no arrancaría.
    rmSync(resolve(ROOT, DIST_DIR, "dev", "lock"), { force: true })

    const server = spawn("npx", ["next", "dev", "-p", String(port), "-H", "127.0.0.1"], {
        cwd: ROOT,
        stdio: ["ignore", "pipe", "pipe"],
        detached: true,
        env: { ...process.env, NEXT_DIST_DIR: DIST_DIR, NODE_ENV: "development" },
    })

    let output = ""

    server.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString() })
    server.stderr?.on("data", (chunk: Buffer) => { output += chunk.toString() })

    return { server, readOutput: () => output }
}

const waitForServer = async (
    baseUrl: string,
    server: ChildProcess,
    readOutput: () => string,
): Promise<void> => {
    const deadline = Date.now() + READY_TIMEOUT_MS

    const fail = (reason: string): never => {
        throw new Error(
            `El dev server de los tests de flujo no quedó disponible en ${baseUrl}: ${reason}\n` +
            `--- salida del server ---\n${tail(readOutput()) || "(sin salida)"}`,
        )
    }

    while (Date.now() < deadline) {
        if (server.exitCode !== null) fail(`el proceso terminó con código ${server.exitCode}`)

        try {
            // Cualquier respuesta HTTP alcanza: sin sesión el endpoint contesta 401.
            await fetch(`${baseUrl}/api/auth/me`)

            return
        } catch {
            await new Promise((done) => setTimeout(done, READY_POLL_MS))
        }
    }

    fail(`no respondió en ${READY_TIMEOUT_MS / 1000} segundos`)
}

const stopServer = async (server: ChildProcess): Promise<void> => {
    if (server.exitCode !== null || server.pid === undefined) return

    const exited = new Promise<void>((done) => server.once("exit", () => done()))

    // `next dev` levanta procesos hijos: se mata el grupo entero o quedan escuchando.
    try {
        process.kill(-server.pid, "SIGTERM")
    } catch {
        server.kill("SIGTERM")
    }

    await Promise.race([exited, new Promise((done) => setTimeout(done, STOP_TIMEOUT_MS))])

    if (server.exitCode === null) {
        try {
            process.kill(-server.pid, "SIGKILL")
        } catch {
            server.kill("SIGKILL")
        }
    }
}

export default async function setup() {
    const baseUrl = process.env.FLOW_BASE_URL
    const port = Number(process.env.FLOW_PORT)

    if (!baseUrl || !Number.isInteger(port)) {
        throw new Error("vitest.config.e2e.ts no resolvió el puerto del server de los tests de flujo")
    }

    const { server, readOutput } = startServer(port)

    try {
        // El seed corre mientras compila el server: los dos tardan y no se pisan.
        await runSeed()
        await waitForServer(baseUrl, server, readOutput)
    } catch (error) {
        await stopServer(server)
        throw error
    }

    return async () => { await stopServer(server) }
}
