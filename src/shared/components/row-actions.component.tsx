import type { LucideIcon } from "lucide-react"
import { cn } from "@/shared/utils/cn.util"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"

export interface RowAction {
    label: string
    icon: LucideIcon
    /** "danger" = texto rojo (solo para Eliminar / Cancelar pedido). */
    tone?: "default" | "muted" | "danger"
    onClick?: () => void
    disabled?: boolean
}

/** Última columna "Acciones" de las tablas del admin: 1 a 3 botones chicos ícono + texto. */
export function RowActions({ actions, className }: { actions: RowAction[]; className?: string }) {
    return (
        <div className={cn("flex items-center justify-end gap-1", className)}>
            {actions.map(({ label, icon: Icon, tone = "default", onClick, disabled }) => (
                <Button
                    key={label}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClick}
                    disabled={disabled}
                    className={cn(
                        "h-[34px] gap-1.5 px-3",
                        tone === "muted" && "text-muted-foreground",
                        tone === "danger" && "text-negative hover:text-negative",
                    )}
                >
                    <Icon className="size-4" aria-hidden />
                    {label}
                </Button>
            ))}
        </div>
    )
}

/** Badge que acompaña al nombre de un registro dado de baja (la fila va con opacity-55). */
export function InactiveBadge({ label = "Inactivo" }: { label?: "Inactivo" | "Inactiva" }) {
    return (
        <Badge variant="outline" className="rounded-full font-semibold text-muted-foreground">
            {label}
        </Badge>
    )
}
