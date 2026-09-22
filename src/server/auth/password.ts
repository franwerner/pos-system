import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"

const ALGORITHM = "scrypt"
const COST = 16384
const BLOCK_SIZE = 8
const PARALLELIZATION = 1
const KEY_LENGTH = 64
const SALT_LENGTH = 16

interface ScryptParams {
    cost: number
    blockSize: number
    parallelization: number
}

const derive = (plain: string, salt: Buffer, params: ScryptParams): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        scrypt(
            plain.normalize("NFKC"),
            salt,
            KEY_LENGTH,
            {
                N: params.cost,
                r: params.blockSize,
                p: params.parallelization,
                // 128 * N * r supera el maxmem por defecto de node con estos parámetros.
                maxmem: 256 * params.cost * params.blockSize,
            },
            (error, key) => (error ? reject(error) : resolve(key)),
        )
    })

export const hashPassword = async (plain: string): Promise<string> => {
    const salt = randomBytes(SALT_LENGTH)
    const params: ScryptParams = {
        cost: COST,
        blockSize: BLOCK_SIZE,
        parallelization: PARALLELIZATION,
    }
    const hash = await derive(plain, salt, params)

    return [
        ALGORITHM,
        params.cost,
        params.blockSize,
        params.parallelization,
        salt.toString("hex"),
        hash.toString("hex"),
    ].join("$")
}

const parseStored = (stored: string) => {
    const parts = stored.split("$")
    if (parts.length !== 6) return null

    const [algorithm, cost, blockSize, parallelization, saltHex, hashHex] = parts
    if (algorithm !== ALGORITHM) return null

    const params: ScryptParams = {
        cost: Number(cost),
        blockSize: Number(blockSize),
        parallelization: Number(parallelization),
    }

    const isPositiveInteger = (value: number) => Number.isInteger(value) && value > 0
    if (!isPositiveInteger(params.cost)) return null
    if (!isPositiveInteger(params.blockSize)) return null
    if (!isPositiveInteger(params.parallelization)) return null

    const isHex = (value: string) => value.length > 0 && value.length % 2 === 0 && /^[0-9a-f]+$/i.test(value)
    if (!isHex(saltHex) || !isHex(hashHex)) return null

    return {
        params,
        salt: Buffer.from(saltHex, "hex"),
        hash: Buffer.from(hashHex, "hex"),
    }
}

export const verifyPassword = async (plain: string, stored: string): Promise<boolean> => {
    const parsed = parseStored(stored)
    if (!parsed) return false

    try {
        const candidate = await derive(plain, parsed.salt, parsed.params)

        if (candidate.length !== parsed.hash.length) return false

        return timingSafeEqual(candidate, parsed.hash)
    } catch {
        return false
    }
}
