import { TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import formatCurrency from "@/shared/utils/formatCurrency.util"

export interface PriceBelowSuggestedAlertProps {
    price: number
    suggested: number
}

/**
 * Alerta de precio bajo. Mostrarla SOLO si hay margen objetivo cargado y price < suggested;
 * si no, no se renderiza nada (la decisión la toma quien la usa, no este componente).
 */
export function PriceBelowSuggestedAlert({ price, suggested }: PriceBelowSuggestedAlertProps) {
    return (
        <Alert role="alert" className="flex items-start gap-3 border-transparent bg-destructive-muted text-destructive-muted-foreground">
            <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
                <AlertTitle className="text-[15px] font-bold">
                    Tu precio actual ({formatCurrency(price)}) quedó por debajo del sugerido
                </AlertTitle>
                <AlertDescription className="text-sm text-destructive-muted-foreground">
                    El sugerido para cubrir tu margen objetivo es {formatCurrency(suggested)}.
                </AlertDescription>
            </div>
        </Alert>
    )
}
