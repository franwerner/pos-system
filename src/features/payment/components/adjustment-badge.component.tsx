import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { Badge } from "@/shared/components/ui/badge"
import { cn } from "@/shared/utils/cn.util"
import { formatAdjustmentPercentage, getAdjustmentKind } from "../services/describeAdjustment.service"
import { type AdjustmentKind } from "../types/payment.type"

const KIND_TEXT: Record<AdjustmentKind, string> = {
    descuento: "descuento",
    recargo: "recargo",
    lista: "precio de lista",
}

/**
 * El signo se lee por tres vías (Design/pantallas/admin-payment-methods.md): número
 * con signo, color e ícono de flecha. `kind` no se recibe: sale de `getAdjustmentKind`.
 */
export function AdjustmentBadge({ tax }: { tax: number }) {
    const kind = getAdjustmentKind(tax)

    return (
        <Badge
            variant="outline"
            className={cn(
                "h-6 gap-1.5 rounded-full px-2.5 text-[13px] font-semibold",
                kind === "descuento" && "border-transparent bg-success-muted text-success-muted-foreground",
                kind === "recargo" && "border-transparent bg-accent text-accent-foreground",
                kind === "lista" && "border-border text-muted-foreground",
            )}
        >
            {kind === "descuento" && <ArrowDownLeft className="size-4" aria-hidden />}
            {kind === "recargo" && <ArrowUpRight className="size-4" aria-hidden />}
            <span className="tabular-nums">{formatAdjustmentPercentage(tax)}</span> {KIND_TEXT[kind]}
        </Badge>
    )
}
