"use client"

import { Eye } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import formatDate from "@/shared/utils/formatDate.util"
import useGetCashPaymentMethods from "../hooks/useGetCashPaymentMethods.hook"
import { calculateCashCount } from "../services/calculateCashCount.service"
import { type CashSessionWithPayments } from "../types/cash-session.type"
import CashCountDifference from "./cash-count-difference.component"

interface CashSessionTableProps {
    sessions: CashSessionWithPayments[]
    onShowDetail: (session: CashSessionWithPayments) => void
}

export default function CashSessionTable({ sessions, onShowDetail }: CashSessionTableProps) {
    const { paymentMethods, cashPaymentMethodIds } = useGetCashPaymentMethods()

    if (sessions.length === 0) {
        return (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                Todavía no hay cierres de caja.
            </p>
        )
    }

    return (
        <div className="rounded-lg border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Apertura</TableHead>
                        <TableHead>Cierre</TableHead>
                        <TableHead className="text-right">Inicial</TableHead>
                        <TableHead className="text-right">Ventas en efectivo</TableHead>
                        <TableHead className="text-right">Otros métodos</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                        <TableHead className="text-right">Egresos</TableHead>
                        <TableHead className="text-right">Esperado</TableHead>
                        <TableHead className="text-right">Contado</TableHead>
                        <TableHead className="text-right">Diferencia</TableHead>
                        <TableHead />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sessions.map((session) => {
                        const count = calculateCashCount({
                            openingAmount: session.opening_amount,
                            sales: session.payments,
                            movements: session.movements,
                            paymentMethods,
                            cashPaymentMethodIds,
                            countedAmount: session.counted_amount,
                        })

                        return (
                            <TableRow key={session.id}>
                                <TableCell className="whitespace-nowrap">
                                    {formatDate(session.opened_at)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                    {session.closed_at ? formatDate(session.closed_at) : "Abierta"}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(count.openingAmount)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(count.cashSalesTotal)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                    {formatCurrency(count.otherSalesTotal)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(count.depositsTotal)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(count.withdrawalsTotal)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(count.expectedAmount)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {count.countedAmount === null
                                        ? "—"
                                        : formatCurrency(count.countedAmount)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <CashCountDifference difference={count.difference} />
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onShowDetail(session)}>
                                            <Eye className="h-4 w-4" />
                                            Ver detalle
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
