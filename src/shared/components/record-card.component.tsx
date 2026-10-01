import type { ReactNode } from "react"
import { cn } from "@/shared/utils/cn.util"

export interface RecordCardProps {
    title: string
    subtitle?: string
    /** Monto o número destacado arriba a la derecha (ej. <Money value={6500} />). */
    value?: ReactNode
    /** Badges abajo a la izquierda. */
    badges?: ReactNode
    /** Botones abajo a la derecha (alto mínimo 40px en celular). */
    actions?: ReactNode
    inactive?: boolean
    /** "danger" = borde rojo (ej. stock negativo o bajo mínimo en celular). */
    tone?: "default" | "danger"
}

/** Versión celular de una fila de tabla del admin: tarjeta con título, dato clave, badges y acciones. */
export function RecordCard({ title, subtitle, value, badges, actions, inactive, tone = "default" }: RecordCardProps) {
    return (
        <div
            className={cn(
                "flex flex-col gap-2 rounded-xl border border-border bg-card p-3.5",
                tone === "danger" && "border-negative",
                inactive && "opacity-55",
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-base font-semibold">{title}</span>
                    {subtitle && <span className="text-[13px] text-muted-foreground">{subtitle}</span>}
                </div>
                {value && <div className="shrink-0 text-right">{value}</div>}
            </div>
            {(badges || actions) && (
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">{badges}</div>
                    <div className="flex items-center gap-1">{actions}</div>
                </div>
            )}
        </div>
    )
}
