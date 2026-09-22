"use client"

import { Badge } from "@/shared/components/ui/badge"
import { cn } from "@/shared/utils/cn.util"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import { CONFIDENCE_LABELS } from "@/features/costing/services/describeConfidence.service"
import { type MeasuredFixedCost } from "@/features/costing/services/calculateMeasuredFixedCost.service"

interface SuggestedPriceProps {
    suggestedPrice: number
    difference: number
    confidence: MeasuredFixedCost["confidence"]
    className?: string
}

// Una diferencia positiva dice que el precio actual está por debajo del que deja
// el margen buscado.
export default function SuggestedPrice({
    suggestedPrice,
    difference,
    confidence,
    className,
}: SuggestedPriceProps) {
    return (
        <div className={cn("flex flex-col items-end gap-0.5", className)}>
            <span className="font-medium">{formatCurrency(suggestedPrice)}</span>
            <span
                className={cn(
                    "text-xs",
                    difference > 0 ? "text-destructive" : "text-muted-foreground",
                )}>
                {difference > 0 ? "+" : ""}
                {formatCurrency(difference)} vs. el actual
            </span>
            {confidence === "preliminary" && (
                <Badge variant="outline" className="text-[10px]">
                    {CONFIDENCE_LABELS.preliminary}
                </Badge>
            )}
        </div>
    )
}
