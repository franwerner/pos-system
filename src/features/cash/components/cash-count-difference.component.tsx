import { cn } from "@/shared/utils/cn.util"
import formatCurrency from "@/shared/utils/formatCurrency.util"

interface CashCountDifferenceProps {
    difference: number | null
    className?: string
}

export default function CashCountDifference({ difference, className }: CashCountDifferenceProps) {
    if (difference === null) {
        return <span className={cn("text-muted-foreground", className)}>—</span>
    }

    if (difference === 0) {
        return <span className={cn("text-muted-foreground", className)}>Sin diferencia</span>
    }

    return (
        <span className={cn(difference > 0 ? "text-primary" : "text-destructive", className)}>
            {formatCurrency(Math.abs(difference))} {difference > 0 ? "de más" : "de menos"}
        </span>
    )
}
