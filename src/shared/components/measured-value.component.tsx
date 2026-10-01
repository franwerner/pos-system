"use client"

import { ArrowLeft, Check, Clock } from "lucide-react"
import { Button } from "./ui/button"

interface MeasuredValueProps {
    label: string
    /** `null` cuando el período no tiene datos con qué medir. */
    value: string | null
    emptyLabel: string
    adoptLabel?: string
    /**
     * Este valor se acaba de copiar al campo con "Usar este valor" y todavía no se guardó:
     * ofrecer el botón de nuevo no tendría sentido, así que se reemplaza por la confirmación.
     */
    adopted?: boolean
    onAdopt: () => void
}

/**
 * El lado medido de un parámetro estimado: lo que dicen los datos del período, al lado
 * del valor declarado, con el botón que lo copia.
 *
 * El declarado nunca se mueve solo —un mes flojo no puede cambiar un precio a espaldas
 * del usuario—, así que adoptar lo medido es siempre un acto explícito. Todo parámetro
 * estimado del sistema se muestra así.
 */
export default function MeasuredValue({
    label,
    value,
    emptyLabel,
    adoptLabel = "Usar este valor",
    adopted = false,
    onAdopt,
}: MeasuredValueProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted px-3 py-2">
            <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                {value === null && <Clock className="size-3.5 shrink-0" aria-hidden />}
                <span>
                    {label}{" "}
                    {value !== null
                        ? <b className="font-semibold text-foreground tabular-nums">{value}</b>
                        : emptyLabel}
                </span>
            </span>
            {value !== null && (
                adopted
                    ? (
                        <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-success-muted-foreground">
                            <Check className="size-4" aria-hidden />
                            Copiado al campo
                        </span>
                    )
                    : (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-9 shrink-0 gap-1.5"
                            onClick={onAdopt}>
                            <ArrowLeft className="size-4" aria-hidden />
                            {adoptLabel}
                        </Button>
                    )
            )}
        </div>
    )
}
