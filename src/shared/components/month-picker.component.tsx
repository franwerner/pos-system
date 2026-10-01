import { CalendarDays } from "lucide-react"
import { Card } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Money } from "@/shared/components/money.component"

export interface MonthPickerProps {
    /** Valor del input type="month": "2026-09". Sin restricción de rango (permite meses pasados). */
    value: string
    onChange?: (value: string) => void
    /** Etiqueta del total en formato largo: "Total de septiembre de 2026". */
    totalLabel: string
    total: number
}

/** Selector de mes + card con el total del período. */
export function MonthPicker({ value, onChange, totalLabel, total }: MonthPickerProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="mes" className="text-sm font-semibold">
                    Mes
                </Label>
                <div className="relative">
                    <CalendarDays
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                    />
                    <Input
                        id="mes"
                        type="month"
                        value={value}
                        onChange={(event) => onChange?.(event.target.value)}
                        className="h-11 w-full pl-9 sm:h-10 sm:w-[220px]"
                    />
                </div>
            </div>
            <Card className="gap-0.5 px-4 py-2.5">
                <span className="text-[13px] font-semibold text-muted-foreground">{totalLabel}</span>
                <Money value={total} size="lg" />
            </Card>
        </div>
    )
}
