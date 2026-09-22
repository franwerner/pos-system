"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/shared/components/ui/dialog"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import formatDate from "@/shared/utils/formatDate.util"
import useGetCashPaymentMethods from "../hooks/useGetCashPaymentMethods.hook"
import { calculateCashCount } from "../services/calculateCashCount.service"
import { type CashSessionWithPayments } from "../types/cash-session.type"
import CashCountBreakdown from "./cash-count-breakdown.component"
import CashCountDifference from "./cash-count-difference.component"
import CashMovementTable from "./cash-movement-table.component"

interface CashSessionDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    session: CashSessionWithPayments | null
}

export default function CashSessionDetailDialog({
    open,
    onOpenChange,
    session,
}: CashSessionDetailDialogProps) {
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Detalle del arqueo</DialogTitle>
                    <DialogDescription>
                        {session
                            ? `Abierta el ${formatDate(session.opened_at)}${session.closed_at ? ` · cerrada el ${formatDate(session.closed_at)}` : ""}`
                            : ""}
                    </DialogDescription>
                </DialogHeader>

                {count && (
                    <div className="flex flex-col gap-4">
                        <CashCountBreakdown count={count} />

                        <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Contado real</span>
                                <span>
                                    {count.countedAmount === null
                                        ? "—"
                                        : formatCurrency(count.countedAmount)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Diferencia</span>
                                <CashCountDifference difference={count.difference} className="font-semibold" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-semibold">Ingresos y egresos</h3>
                            <CashMovementTable movements={session?.movements ?? []} />
                        </div>

                        {session?.note && (
                            <p className="text-sm text-muted-foreground">{session.note}</p>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
