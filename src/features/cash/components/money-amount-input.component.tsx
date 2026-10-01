import { cn } from "@/shared/utils/cn.util"
import { Input } from "@/shared/components/ui/input"

interface MoneyAmountInputProps extends Omit<React.ComponentProps<"input">, "prefix"> {
    /** true = campo protagonista (monto inicial, contado real): más grande. */
    large?: boolean
    invalid?: boolean
}

/**
 * Input de monto con "$" fijo adelante (abrir caja, registrar movimiento, cerrar caja).
 * Solo presentación: el valor y el cambio los maneja react-hook-form como con cualquier otro input.
 */
export function MoneyAmountInput({ large, invalid, className, ref, ...props }: MoneyAmountInputProps & { ref?: React.Ref<HTMLInputElement> }) {
    return (
        <div className="relative">
            <span
                className={cn(
                    "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
                    large && "text-xl font-bold",
                )}
            >
                $
            </span>
            <Input
                ref={ref}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0"
                aria-invalid={invalid || undefined}
                className={cn(
                    "pl-7 tabular-nums",
                    large ? "h-14 pl-8 text-2xl font-bold sm:h-14" : "h-11 sm:h-10",
                    className,
                )}
                {...props}
            />
        </div>
    )
}
