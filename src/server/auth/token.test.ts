import { SignJWT } from "jose"
import { beforeAll, describe, expect, it } from "vitest"
import { signSessionToken, verifySessionToken } from "./token"

const SECRET = "test-secret-para-los-tokens"

const signWith = (secret: string, expiresAt: number) =>
    new SignJWT({ username: "admin" })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("1")
        .setIssuedAt(expiresAt - 60)
        .setExpirationTime(expiresAt)
        .sign(new TextEncoder().encode(secret))

beforeAll(() => {
    process.env.AUTH_JWT_SECRET = SECRET
})

describe("verifySessionToken", () => {
    it("verifica un token propio y devuelve el usuario", async () => {
        const token = await signSessionToken({ id: 7, username: "admin" })

        expect(await verifySessionToken(token)).toEqual({ id: 7, username: "admin" })
    })

    it("rechaza un token firmado con otro secreto", async () => {
        const token = await signWith("otro-secreto-distinto", Math.floor(Date.now() / 1000) + 3600)

        expect(await verifySessionToken(token)).toBeNull()
    })

    it("rechaza un token vencido", async () => {
        const token = await signWith(SECRET, Math.floor(Date.now() / 1000) - 60)

        expect(await verifySessionToken(token)).toBeNull()
    })

    it("rechaza un token que no es un token", async () => {
        expect(await verifySessionToken("no-es-un-jwt")).toBeNull()
    })
})
