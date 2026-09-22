import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const ENV_FILE = ".env.local"

const parse = (content: string): Record<string, string> =>
    content.split("\n").reduce<Record<string, string>>((values, rawLine) => {
        const line = rawLine.trim()

        if (!line || line.startsWith("#")) return values

        const separator = line.indexOf("=")

        if (separator < 0) return values

        const key = line.slice(0, separator).trim()
        const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "")

        return { ...values, [key]: value }
    }, {})

export const readLocalEnv = (root: string = process.cwd()): Record<string, string> => {
    const path = resolve(root, ENV_FILE)

    if (!existsSync(path)) {
        throw new Error(
            `Los tests de flujo necesitan ${ENV_FILE} en la raíz del proyecto y no lo encontré en ${path}`,
        )
    }

    return parse(readFileSync(path, "utf8"))
}

export const requireLocalEnv = (values: Record<string, string>, key: string): string => {
    const value = values[key]

    if (!value) throw new Error(`Falta ${key} en ${ENV_FILE}: los tests de flujo no pueden correr sin eso`)

    return value
}
