import type { LucideIcon } from "lucide-react"
import { Coffee, CupSoda, Drumstick, Sandwich, Utensils } from "lucide-react"
import { type PlateTone } from "@/shared/components/product-plate.component"

export interface CategoryVisual {
    icon?: LucideIcon
    tone?: PlateTone
}

/**
 * La categoría no tiene ícono ni "tono" de plato propios (no hay columna para eso en la
 * tabla `category`, y agregarla es un cambio de esquema que este plan no pide). Se deriva
 * un ícono/tono por palabra clave del nombre para que la grilla no quede toda gris cuando
 * un producto no tiene foto — igual al criterio visual del diseño, sin depender de datos
 * que hoy no existen. Sin categoría o sin coincidencia: `ProductPlate` usa su propio
 * default (ícono genérico, tono `muted`).
 */
const RULES: Array<{ match: RegExp; icon: LucideIcon; tone: PlateTone }> = [
    { match: /hamburguesa/i, icon: Sandwich, tone: "accent" },
    { match: /milanesa|carne|pollo/i, icon: Drumstick, tone: "accent" },
    { match: /papa|frit/i, icon: Utensils, tone: "warning" },
    { match: /comida/i, icon: Utensils, tone: "accent" },
    { match: /gaseosa|agua|bebida|jugo/i, icon: CupSoda, tone: "info" },
    { match: /postre|café|cafe/i, icon: Coffee, tone: "success" },
]

export function resolveCategoryVisual(categoryName?: string | null): CategoryVisual {
    if (!categoryName) return {}

    const rule = RULES.find(({ match }) => match.test(categoryName))

    return rule ? { icon: rule.icon, tone: rule.tone } : {}
}
