import { ArrowDownLeft, ArrowUpRight, CircleCheck, Hourglass } from "lucide-react"
import { cn } from "@/shared/utils/cn.util"
import formatCurrency from "@/shared/utils/formatCurrency.util"

/*
 * Protagonista al cerrar la caja: la diferencia de arqueo en vivo, con su color (gris "—", verde
 * sin diferencia, amarillo sobra, rojo falta). Se recalcula mientras se escribe el contado real y
 * nunca bloquea el cierre (PLAN-UI/vistas/admin-cash.md). También se usa, más chica, en el detalle
 * de solo lectura de una sesión cerrada.
 */

interface CashDifferencePanelProps {
    difference: number | null
    /** Si vienen junto a `expected`, la bajada termina con "Contado $X · esperado $Y." */
    counted?: number | null
    expected?: number
    /** "close" = protagonista (diálogo de cierre); "detail" = más chica (detalle de solo lectura). */
    size?: "close" | "detail"
    className?: string
}

export function CashDifferencePanel({ difference, counted, expected, size = "close", className }: CashDifferencePanelProps) {
    const kind = difference === null ? "pending" : difference === 0 ? "none" : difference > 0 ? "over" : "short"

    const tone = {
        pending: "bg-muted text-muted-foreground",
        none: "bg-success-muted text-success-muted-foreground",
        over: "bg-warning-muted text-warning-muted-foreground",
        short: "bg-destructive-muted text-destructive-muted-foreground",
    }[kind]

    const Icon = { pending: Hourglass, none: CircleCheck, over: ArrowUpRight, short: ArrowDownLeft }[kind]

    const amounts = counted != null && expected !== undefined
        ? ` Contado ${formatCurrency(counted)} · esperado ${formatCurrency(expected)}.`
        : ""

    const caption =
        kind === "pending"
            ? "Escribí lo que contaste y la diferencia aparece acá."
            : kind === "none"
                ? `Lo contado coincide con lo esperado.${amounts}`
                : kind === "over"
                    ? `Sobra plata en el cajón.${amounts}`
                    : `Falta plata en el cajón.${amounts}`

    const big = size === "close" ? "text-[34px] sm:text-[44px]" : "text-[34px]"
    const unit = size === "close" ? "text-xl sm:text-2xl" : "text-xl"

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn("flex flex-col gap-1.5 rounded-2xl p-4", size === "close" && "sm:px-[22px] sm:py-5", tone, className)}
        >
            <span className="flex items-center gap-2 text-sm font-bold">
                <Icon className="size-4" aria-hidden /> Diferencia
            </span>
            <span className={cn("whitespace-nowrap font-extrabold leading-[1.05] tracking-[-0.02em] tabular-nums", big)}>
                {kind === "pending" && "—"}
                {kind === "none" && "Sin diferencia"}
                {(kind === "over" || kind === "short") && (
                    <>
                        {formatCurrency(Math.abs(difference!))}{" "}
                        <span className={cn("tracking-normal", unit)}>{kind === "over" ? "de más" : "de menos"}</span>
                    </>
                )}
            </span>
            <span className="text-sm opacity-90">{caption}</span>
        </div>
    )
}
