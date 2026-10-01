import { Info, TriangleAlert } from "lucide-react"
import { cn } from "@/shared/utils/cn.util"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import { type CashCount } from "../services/calculateCashCount.service"

interface CashCountBreakdownProps {
    count: CashCount
    className?: string
}

function Kv({ label, value, muted, hint }: { label: string; value: string; muted?: boolean; hint?: boolean }) {
    return (
        <div className={cn("flex items-baseline justify-between gap-4 py-2 text-[15px]", muted && "text-muted-foreground")}>
            <span>
                {label}
                {hint && <span className="text-xs font-medium"> (no entra al arqueo)</span>}
            </span>
            <span className="font-bold tabular-nums">{value}</span>
        </div>
    )
}

/** Desglose de arqueo: al cerrar la caja y en el detalle de una sesión cerrada. */
export default function CashCountBreakdown({ count, className }: CashCountBreakdownProps) {
    return (
        <div className={cn("flex flex-col rounded-[14px] border border-border px-4 py-2", className)}>
            <Kv label="Monto inicial" value={formatCurrency(count.openingAmount)} />

            {count.totalsByPaymentMethod.length === 0 ? (
                <div className="my-1 flex items-center gap-2 rounded-[10px] bg-muted px-3 py-2.5 text-sm">
                    <Info className="size-4" aria-hidden /> Esta caja todavía no tiene ventas.
                </div>
            ) : (
                count.totalsByPaymentMethod.map((method) => (
                    <Kv
                        key={method.payment_method_id}
                        label={method.name}
                        value={formatCurrency(method.total)}
                        muted={!method.is_cash}
                        hint={!method.is_cash}
                    />
                ))
            )}

            <Kv label="Ingresos" value={`+ ${formatCurrency(count.depositsTotal)}`} />
            <Kv label="Egresos" value={`− ${formatCurrency(count.withdrawalsTotal)}`} />

            <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-border pt-3 pb-2 text-[17px] font-extrabold">
                <span>Esperado en caja</span>
                <span className="tabular-nums">{formatCurrency(count.expectedAmount)}</span>
            </div>

            {count.noCashMethod && (
                <div
                    role="status"
                    className="mt-2.5 mb-2 flex items-start gap-2.5 rounded-lg bg-warning-muted p-3 text-warning-muted-foreground"
                >
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <div>
                        <p className="text-sm font-bold">Ningún medio de pago cuenta como efectivo</p>
                        <p className="text-[13px]">
                            Ninguna venta suma al esperado en caja. Si cobrás en mano, poné &quot;Efectivo&quot; en el nombre de
                            ese medio de pago en Tarifas.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
