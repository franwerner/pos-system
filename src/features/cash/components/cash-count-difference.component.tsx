import { ArrowDownLeft, ArrowUpRight, Check, Hourglass } from "lucide-react"
import { cn } from "@/shared/utils/cn.util"
import { Badge } from "@/shared/components/ui/badge"
import formatCurrency from "@/shared/utils/formatCurrency.util"

/*
 * Diferencia de arqueo, versión chica (historial y filas de detalle): sin contar ("—"), coincide
 * (verde), sobra plata (amarillo) o falta plata (rojo). La versión grande y protagonista que se ve
 * mientras se cuenta al cerrar la caja vive en `cash-difference-panel.component.tsx`.
 */

interface CashCountDifferenceProps {
    difference: number | null
    className?: string
}

export default function CashCountDifference({ difference, className }: CashCountDifferenceProps) {
    if (difference === null) {
        return (
            <span className={cn("flex items-center gap-2 text-muted-foreground", className)}>
                <Hourglass className="size-4" aria-hidden /> <span className="text-xs">sin contar</span>
            </span>
        )
    }

    if (difference === 0) {
        return (
            <Badge
                className={cn(
                    "gap-1.5 rounded-full border-transparent bg-success-muted px-2.5 py-1 text-[13px] font-semibold text-success-muted-foreground",
                    className,
                )}
            >
                <Check className="size-4" aria-hidden /> Sin diferencia
            </Badge>
        )
    }

    const over = difference > 0

    return (
        <Badge
            className={cn(
                "gap-1.5 rounded-full border-transparent px-2.5 py-1 text-[13px] font-semibold",
                over ? "bg-warning-muted text-warning-muted-foreground" : "bg-destructive-muted text-destructive-muted-foreground",
                className,
            )}
        >
            {over ? <ArrowUpRight className="size-4" aria-hidden /> : <ArrowDownLeft className="size-4" aria-hidden />}
            {formatCurrency(Math.abs(difference))} {over ? "de más" : "de menos"}
        </Badge>
    )
}
