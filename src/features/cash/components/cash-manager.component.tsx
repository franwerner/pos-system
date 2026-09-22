"use client"

import { ArrowDownUp, LockKeyhole, Wallet } from "lucide-react"
import { useState } from "react"
import { Loader } from "@/shared/components/loader.component"
import { Button } from "@/shared/components/ui/button"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import formatDate from "@/shared/utils/formatDate.util"
import useGetCashPaymentMethods from "../hooks/useGetCashPaymentMethods.hook"
import useGetCashSessions from "../hooks/useGetCashSessions.hook"
import { calculateCashCount } from "../services/calculateCashCount.service"
import { type CashSessionWithPayments } from "../types/cash-session.type"
import CashMovementFormDialog from "./cash-movement-form-dialog.component"
import CashMovementTable from "./cash-movement-table.component"
import CashSessionDetailDialog from "./cash-session-detail-dialog.component"
import CashSessionTable from "./cash-session-table.component"
import CloseCashSessionDialog from "./close-cash-session-dialog.component"
import OpenCashSessionDialog from "./open-cash-session-dialog.component"

export default function CashManager() {
    const [isOpenFormOpen, setIsOpenFormOpen] = useState(false)
    const [isCloseFormOpen, setIsCloseFormOpen] = useState(false)
    const [isMovementFormOpen, setIsMovementFormOpen] = useState(false)
    const [detailSession, setDetailSession] = useState<CashSessionWithPayments | null>(null)

    const { data: sessions, isLoading } = useGetCashSessions()
    const { paymentMethods, cashPaymentMethodIds } = useGetCashPaymentMethods()

    const openSession = (sessions ?? []).find((session) => !session.closed_at) ?? null

    const openCount = openSession
        ? calculateCashCount({
            openingAmount: openSession.opening_amount,
            sales: openSession.payments,
            movements: openSession.movements,
            paymentMethods,
            cashPaymentMethodIds,
        })
        : null

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Caja</h1>
                    <p className="text-sm text-muted-foreground">
                        Apertura con monto inicial, ingresos y egresos, cierre con arqueo e historial de cierres.
                    </p>
                </div>
                {!isLoading && !openSession && (
                    <Button onClick={() => setIsOpenFormOpen(true)}>
                        <Wallet className="h-4 w-4" />
                        Abrir caja
                    </Button>
                )}
            </div>

            {isLoading
                ? <Loader className="h-64" />
                : (
                    <>
                        {openSession && openCount
                            ? (
                                <>
                                    <div className="flex flex-col gap-4 rounded-lg border bg-card p-6">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h2 className="text-lg font-semibold">Caja abierta</h2>
                                                <p className="text-sm text-muted-foreground">
                                                    Desde el {formatDate(openSession.opened_at)}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setIsMovementFormOpen(true)}>
                                                    <ArrowDownUp className="h-4 w-4" />
                                                    Registrar ingreso o egreso
                                                </Button>
                                                <Button variant="outline" onClick={() => setIsCloseFormOpen(true)}>
                                                    <LockKeyhole className="h-4 w-4" />
                                                    Cerrar caja
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Monto inicial</p>
                                                <p className="text-lg font-semibold">
                                                    {formatCurrency(openCount.openingAmount)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Ventas en efectivo</p>
                                                <p className="text-lg font-semibold">
                                                    {formatCurrency(openCount.cashSalesTotal)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Otros métodos</p>
                                                <p className="text-lg font-semibold">
                                                    {formatCurrency(openCount.otherSalesTotal)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Ingresos</p>
                                                <p className="text-lg font-semibold">
                                                    + {formatCurrency(openCount.depositsTotal)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Egresos</p>
                                                <p className="text-lg font-semibold">
                                                    − {formatCurrency(openCount.withdrawalsTotal)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Esperado en caja</p>
                                                <p className="text-lg font-semibold">
                                                    {formatCurrency(openCount.expectedAmount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <h2 className="text-lg font-semibold">Ingresos y egresos</h2>
                                        <CashMovementTable movements={openSession.movements} />
                                    </div>
                                </>
                            )
                            : (
                                <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                                    No hay una caja abierta. Sin caja abierta no se puede cobrar en el punto de venta.
                                </p>
                            )}

                        <div className="flex flex-col gap-3">
                            <h2 className="text-lg font-semibold">Historial</h2>
                            <CashSessionTable
                                sessions={(sessions ?? []).filter((session) => !!session.closed_at)}
                                onShowDetail={setDetailSession}
                            />
                        </div>
                    </>
                )}

            <OpenCashSessionDialog open={isOpenFormOpen} onOpenChange={setIsOpenFormOpen} />

            <CashMovementFormDialog
                open={isMovementFormOpen}
                onOpenChange={setIsMovementFormOpen}
                sessionId={openSession?.id ?? null}
            />

            <CloseCashSessionDialog
                open={isCloseFormOpen}
                onOpenChange={setIsCloseFormOpen}
                session={openSession}
            />

            <CashSessionDetailDialog
                open={!!detailSession}
                onOpenChange={(open) => !open && setDetailSession(null)}
                session={detailSession}
            />
        </div>
    )
}
