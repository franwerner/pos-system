import { describe, expect, it } from "vitest"
import { hashPassword, verifyPassword } from "./password"

describe("hashPassword", () => {
    it("no guarda la contraseña en claro", async () => {
        const stored = await hashPassword("secreto123")

        expect(stored).not.toBe("secreto123")
        expect(stored).not.toContain("secreto123")
        expect(stored.startsWith("scrypt$")).toBe(true)
    })

    it("dos hashes de la misma contraseña son distintos", async () => {
        const first = await hashPassword("secreto123")
        const second = await hashPassword("secreto123")

        expect(first).not.toBe(second)
        expect(await verifyPassword("secreto123", first)).toBe(true)
        expect(await verifyPassword("secreto123", second)).toBe(true)
    })
})

describe("verifyPassword", () => {
    it("acepta la contraseña correcta", async () => {
        const stored = await hashPassword("secreto123")

        expect(await verifyPassword("secreto123", stored)).toBe(true)
    })

    it("rechaza la contraseña incorrecta", async () => {
        const stored = await hashPassword("secreto123")

        expect(await verifyPassword("secreto124", stored)).toBe(false)
        expect(await verifyPassword("", stored)).toBe(false)
    })

    it("devuelve false ante un hash guardado malformado", async () => {
        const malformed = [
            "",
            "secreto123",
            "scrypt$16384$8",
            "bcrypt$16384$8$1$aabb$ccdd",
            "scrypt$abc$8$1$aabb$ccdd",
            "scrypt$16384$8$1$zzzz$ccdd",
            "scrypt$16384$8$1$aabb$",
        ]

        for (const stored of malformed) {
            expect(await verifyPassword("secreto123", stored)).toBe(false)
        }
    })
})
