import { cn } from "@/shared/utils/cn.util"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import { type CashCount } from "../services/calculateCashCount.service"

interface CashCountBreakdownProps {
    count: CashCount
    className?: string
}

export default function CashCountBreakdown({ count, className }: CashCountBreakdownProps) {
    return (
        <div className={cn("flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 text-sm", className)}>
            <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monto inicial</span>
                <span>{formatCurrency(count.openingAmount)}</span>
            </div>

            {count.totalsByPaymentMethod.map((method) => (
                <div key={method.payment_method_id} className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                        {method.name}
                        {!method.is_cash && " (no entra al arqueo)"}
                    </span>
                    <span className={cn(!method.is_cash && "text-muted-foreground")}>
                        {formatCurrency(method.total)}
                    </span>
                </div>
            ))}

            {count.totalsByPaymentMethod.length === 0 && (
                <p className="text-muted-foreground">Esta caja todavía no tiene ventas.</p>
            )}

            <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ingresos</span>
                <span>+ {formatCurrency(count.depositsTotal)}</span>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Egresos</span>
                <span>− {formatCurrency(count.withdrawalsTotal)}</span>
            </div>

            <div className="flex items-center justify-between border-t pt-2 font-semibold">
                <span>Esperado en caja</span>
                <span>{formatCurrency(count.expectedAmount)}</span>
            </div>
        </div>
    )
}
