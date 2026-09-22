import { describe, expect, it } from "vitest"
import { resolveMonthRange } from "./resolveMonthRange.service"

describe("resolveMonthRange", () => {
    it("abarca el mes completo", () => {
        expect(resolveMonthRange("2026-09")).toEqual({
            from: "2026-09-01T00:00:00.000Z",
            to: "2026-10-01T00:00:00.000Z",
        })
    })

    it("pasa al año siguiente en diciembre", () => {
        expect(resolveMonthRange("2026-12").to).toBe("2027-01-01T00:00:00.000Z")
    })

    it("rechaza un mes con formato inválido", () => {
        expect(() => resolveMonthRange("2026-9")).toThrowError(/AAAA-MM/)
    })
})
