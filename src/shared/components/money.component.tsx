import formatCurrency from "@/shared/utils/formatCurrency.util"
import { cn } from "@/shared/utils/cn.util"

type MoneySize = "sm" | "md" | "lg" | "xl" | "hero"
type MoneyTone = "default" | "muted" | "positive" | "negative" | "auto"

const sizeClass: Record<MoneySize, string> = {
    sm: "text-sm font-semibold",
    md: "text-xl font-bold",
    lg: "text-3xl font-extrabold leading-tight",
    xl: "text-[44px] font-extrabold leading-none tracking-tight",
    hero: "text-[40px] font-extrabold leading-none tracking-tight",
}

const toneClass: Record<Exclude<MoneyTone, "auto">, string> = {
    default: "text-foreground",
    muted: "text-muted-foreground",
    positive: "text-success-muted-foreground",
    negative: "text-negative",
}

export interface MoneyProps {
    value: number
    /**
     * Fuerza una cantidad de decimales (ej. 2 para costos unitarios como "$12,35/gr").
     * Sin esto, `formatCurrency` decide según el valor (igual que en el resto de la app).
     */
    decimals?: number
    size?: MoneySize
    /** "auto" = rojo si es negativo, texto normal si no. */
    tone?: MoneyTone
    /** Texto pegado después del monto, ej. "/gr" o " c/u". */
    suffix?: string
    className?: string
}

/**
 * Monto en pesos con cifras tabulares, usando el `formatCurrency` real de la app (no el
 * `lib/format.ts` del export: se mantiene un solo formateador de moneda en todo el sistema).
 */
export function Money({ value, decimals, size = "md", tone = "default", suffix, className }: MoneyProps) {
    const resolved = tone === "auto" ? (value < 0 ? "negative" : "default") : tone
    const formatted =
        decimals === undefined
            ? formatCurrency(value)
            : new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals,
              }).format(value)
    return (
        <span className={cn("tabular-nums", sizeClass[size], toneClass[resolved], className)}>
            {formatted}
            {suffix}
        </span>
    )
}
