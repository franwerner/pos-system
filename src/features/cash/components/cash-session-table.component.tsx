"use client"

import { Archive, Eye } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table"
import { EmptyState } from "@/shared/components/empty-state.component"
import { RecordCard } from "@/shared/components/record-card.component"
import { RowActions } from "@/shared/components/row-actions.component"
import { TableSkeleton } from "@/shared/components/table-skeleton.component"
import { cn } from "@/shared/utils/cn.util"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import useGetCashPaymentMethods from "../hooks/useGetCashPaymentMethods.hook"
import { calculateCashCount } from "../services/calculateCashCount.service"
import { type CashSessionWithPayments } from "../types/cash-session.type"
import CashCountDifference from "./cash-count-difference.component"

const HEADERS = [
    "Apertura", "Cierre", "Inicial", "Ventas en efectivo", "Otros métodos", "Ingresos", "Egresos", "Esperado", "Contado", "Diferencia", "",
]
const WIDTHS = ["w-[90px]", "w-[90px]", "w-14", "w-16", "w-16", "w-12", "w-12", "w-16", "w-16", "w-24"]

const formatSessionDate = (value: string) =>
    new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" }).format(new Date(value))
const formatSessionTime = (value: string) =>
    new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value))

function DateTime({ value }: { value: string }) {
    return (
        <div className="flex flex-col whitespace-nowrap">
            <span className="font-semibold">{formatSessionDate(value)}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{formatSessionTime(value)}</span>
        </div>
    )
}

interface CashSessionTableProps {
    sessions: CashSessionWithPayments[]
    isLoading?: boolean
    onShowDetail: (session: CashSessionWithPayments) => void
}

/** "Historial" de cierres: tabla (md+), tarjetas (celular), vacío o cargando. */
export default function CashSessionTable({ sessions, isLoading, onShowDetail }: CashSessionTableProps) {
    const { paymentMethods, cashPaymentMethodIds } = useGetCashPaymentMethods()

    if (isLoading) {
        return <TableSkeleton headers={HEADERS.filter(Boolean)} rows={3} widths={WIDTHS} />
    }

    if (sessions.length === 0) {
        return (
            <Card className="p-5">
                <EmptyState
                    icon={Archive}
                    variant="plain"
                    title="Todavía no hay cierres de caja."
                    description="Cuando cierres la primera caja, su arqueo queda guardado acá."
                />
            </Card>
        )
    }

    const num = "whitespace-nowrap text-right tabular-nums"

    return (
        <>
            <Card className="hidden overflow-hidden p-0 md:block">
                <Table className="text-sm">
                    <TableHeader>
                        <TableRow>
                            {HEADERS.map((header, index) => (
                                <TableHead
                                    key={index}
                                    className={cn(
                                        "whitespace-normal align-bottom text-[13px] font-semibold text-muted-foreground",
                                        header !== "Apertura" && header !== "Cierre" && header !== "" && "text-right",
                                    )}
                                >
                                    {header}
                                </TableHead>
                            ))}
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
                                    <TableCell className="py-2.5"><DateTime value={session.opened_at} /></TableCell>
                                    <TableCell>{session.closed_at && <DateTime value={session.closed_at} />}</TableCell>
                                    <TableCell className={num}>{formatCurrency(count.openingAmount)}</TableCell>
                                    <TableCell className={num}>{formatCurrency(count.cashSalesTotal)}</TableCell>
                                    <TableCell className={cn(num, "text-muted-foreground")}>{formatCurrency(count.otherSalesTotal)}</TableCell>
                                    <TableCell className={num}>{`+ ${formatCurrency(count.depositsTotal)}`}</TableCell>
                                    <TableCell className={num}>{formatCurrency(count.withdrawalsTotal)}</TableCell>
                                    <TableCell className={cn(num, "font-semibold")}>{formatCurrency(count.expectedAmount)}</TableCell>
                                    <TableCell className={cn(num, "font-semibold")}>
                                        {count.countedAmount === null ? "—" : formatCurrency(count.countedAmount)}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap"><CashCountDifference difference={count.difference} /></TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        <RowActions actions={[{ label: "Ver detalle", icon: Eye, onClick: () => onShowDetail(session) }]} />
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </Card>

            <div className="flex flex-col gap-2.5 md:hidden">
                {sessions.map((session) => {
                    const count = calculateCashCount({
                        openingAmount: session.opening_amount,
                        sales: session.payments,
                        movements: session.movements,
                        paymentMethods,
                        cashPaymentMethodIds,
                        countedAmount: session.counted_amount,
                    })

                    const title = session.closed_at
                        ? `${formatSessionDate(session.opened_at)} · ${formatSessionTime(session.opened_at)} a ${formatSessionTime(session.closed_at)}`
                        : formatSessionDate(session.opened_at)

                    return (
                        <RecordCard
                            key={session.id}
                            title={title}
                            subtitle={`Esperado ${formatCurrency(count.expectedAmount)} · contado ${count.countedAmount === null ? "—" : formatCurrency(count.countedAmount)}`}
                            badges={<CashCountDifference difference={count.difference} />}
                            actions={
                                <Button variant="outline" size="sm" className="h-10 gap-2" onClick={() => onShowDetail(session)}>
                                    <Eye className="size-4" aria-hidden /> Ver detalle
                                </Button>
                            }
                        />
                    )
                })}
            </div>
        </>
    )
}
