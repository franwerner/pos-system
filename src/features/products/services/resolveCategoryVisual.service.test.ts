import { Coffee, CupSoda, Drumstick, Sandwich, Utensils } from "lucide-react"
import { describe, expect, it } from "vitest"
import { resolveCategoryVisual } from "./resolveCategoryVisual.service"

describe("resolveCategoryVisual", () => {
    it("devuelve vacío sin categoría", () => {
        expect(resolveCategoryVisual(undefined)).toEqual({})
        expect(resolveCategoryVisual(null)).toEqual({})
    })

    it("devuelve vacío cuando el nombre no matchea ninguna palabra clave", () => {
        expect(resolveCategoryVisual("Varios")).toEqual({})
    })

    it("reconoce hamburguesas", () => {
        expect(resolveCategoryVisual("Hamburguesas")).toEqual({ icon: Sandwich, tone: "accent" })
    })

    it("reconoce milanesas", () => {
        expect(resolveCategoryVisual("Milanesas")).toEqual({ icon: Drumstick, tone: "accent" })
    })

    it("reconoce comidas genéricas", () => {
        expect(resolveCategoryVisual("Comidas")).toEqual({ icon: Utensils, tone: "accent" })
    })

    it("reconoce bebidas y gaseosas", () => {
        expect(resolveCategoryVisual("Gaseosas")).toEqual({ icon: CupSoda, tone: "info" })
        expect(resolveCategoryVisual("Bebidas")).toEqual({ icon: CupSoda, tone: "info" })
    })

    it("reconoce postres y café", () => {
        expect(resolveCategoryVisual("Postres")).toEqual({ icon: Coffee, tone: "success" })
        expect(resolveCategoryVisual("Café")).toEqual({ icon: Coffee, tone: "success" })
    })

    it("no distingue mayúsculas/minúsculas", () => {
        expect(resolveCategoryVisual("HAMBURGUESAS")).toEqual({ icon: Sandwich, tone: "accent" })
    })
})
