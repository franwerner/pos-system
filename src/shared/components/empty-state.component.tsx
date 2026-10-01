import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/shared/utils/cn.util"

export interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description?: string
    /** Botón opcional (ej. "Borrar búsqueda", "Reintentar", "Volver al inicio"). */
    action?: ReactNode
    /** "dashed" = recuadro punteado (listas admin); "plain" = sin borde (carrito, pantallas completas). */
    variant?: "dashed" | "plain"
    /** "error" = borde e ícono rojos (falló la carga). "success" = ícono verde (ej. "Todo cobrado"). */
    tone?: "default" | "error" | "success"
    /** "lg" = ícono 80px y título 24px (pantalla completa, ej. checkout sin productos). */
    size?: "md" | "lg"
    className?: string
}

/**
 * Estado vacío genérico. Tono POS: "Carrito vacío". Tono admin: "Todavía no hay {cosa}
 * cargada(s)." o "No hay {cosa} que coincidan con el filtro."
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    variant = "dashed",
    tone = "default",
    size = "md",
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center gap-2 rounded-xl px-6 py-9 text-center text-muted-foreground",
                variant === "dashed" && "border-[1.5px] border-dashed border-border",
                tone === "error" && variant === "dashed" && "border-negative",
                className,
            )}
        >
            <div
                className={cn(
                    "mb-1 flex items-center justify-center rounded-xl bg-muted text-muted-foreground",
                    size === "lg" ? "size-20" : "size-14",
                    tone === "error" && "bg-destructive-muted text-destructive-muted-foreground",
                    tone === "success" && "bg-success-muted text-success-muted-foreground",
                )}
            >
                <Icon className={size === "lg" ? "size-10" : "size-7"} aria-hidden />
            </div>
            <p className={cn("font-bold text-foreground", size === "lg" ? "text-2xl" : "text-[17px]")}>{title}</p>
            {description && (
                <p className={cn("max-w-[360px]", size === "lg" ? "text-base" : "text-sm")}>{description}</p>
            )}
            {action && <div className="mt-2">{action}</div>}
        </div>
    )
}
