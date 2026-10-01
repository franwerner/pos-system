"use client"

import { Button } from "@/shared/components/ui/button"
import { DialogShell } from "@/shared/components/dialog-shell.component"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import formatDate from "@/shared/utils/formatDate.util"
import useGetCashPaymentMethods from "../hooks/useGetCashPaymentMethods.hook"
import { calculateCashCount } from "../services/calculateCashCount.service"
import { type CashSessionWithPayments } from "../types/cash-session.type"
import CashCountBreakdown from "./cash-count-breakdown.component"
import { CashDifferencePanel } from "./cash-difference-panel.component"
import CashMovementTable from "./cash-movement-table.component"

interface CashSessionDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    session: CashSessionWithPayments | null
}

/** Detalle de una sesión cerrada: solo lectura, se recalcula siempre en vivo con los pagos reales. */
export default function CashSessionDetailDialog({ open, onOpenChange, session }: CashSessionDetailDialogProps) {
    const { paymentMethods, cashPaymentMethodIds } = useGetCashPaymentMethods()

    const count = session
        ? calculateCashCount({
            openingAmount: session.opening_amount,
            sales: session.payments,
            movements: session.movements,
            paymentMethods,
            cashPaymentMethodIds,
            countedAmount: session.counted_amount,
        })
        : null

    return (
        <DialogShell
            open={open}
            onOpenChange={onOpenChange}
            title="Detalle del arqueo"
            description="Solo lectura. Se recalcula con los pagos de cada venta cobrada."
            mobileBarTitle="Detalle del arqueo"
            mobileShowTitle
            widthClass="sm:max-w-[860px]"
            footer={
                <Button variant="outline" className="h-12 w-full sm:h-10 sm:w-auto" onClick={() => onOpenChange(false)}>
                    Cerrar
                </Button>
            }
        >
            {count && session && (
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-6">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-muted-foreground">Apertura</span>
                            <span className="font-semibold tabular-nums">{formatDate(session.opened_at)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-muted-foreground">Cierre</span>
                            <span className="font-semibold tabular-nums">
                                {session.closed_at ? formatDate(session.closed_at) : "—"}
                            </span>
                        </div>
                    </div>

                    <div className="grid items-start gap-6 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                        <CashCountBreakdown count={count} />
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between gap-4 text-base">
                                <span>Contado real</span>
                                <span className="font-bold tabular-nums">
                                    {count.countedAmount === null ? "—" : formatCurrency(count.countedAmount)}
                                </span>
                            </div>
                            <CashDifferencePanel
                                difference={count.difference}
                                counted={count.countedAmount}
                                expected={count.expectedAmount}
                                size="detail"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold">Ingresos y egresos</span>
                        {session.movements.length === 0 ? (
                            <p className="rounded-xl border-[1.5px] border-dashed border-border px-3.5 py-3 text-sm text-muted-foreground">
                                Esta caja no tuvo ingresos ni egresos.
                            </p>
                        ) : (
                            <CashMovementTable movements={session.movements} compact />
                        )}
                    </div>

                    {session.note && (
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold">Nota</span>
                            <p className="text-sm">{session.note}</p>
                        </div>
                    )}
                </div>
            )}
        </DialogShell>
    )
}
