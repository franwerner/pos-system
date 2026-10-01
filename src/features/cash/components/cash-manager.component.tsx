"use client"

import { Wallet } from "lucide-react"
import { useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { CajaClosedPage } from "@/shared/components/caja-indicator.component"
import { PageHeader } from "@/shared/components/page-header.component"
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
import OpenSessionCard, { OpenSessionCardSkeleton } from "./open-session-card.component"

function AbrirCajaButton({ onClick }: { onClick: () => void }) {
    return (
        <Button size="lg" className="h-12 gap-2 md:text-base" onClick={onClick}>
            <Wallet className="size-5" aria-hidden /> Abrir caja
        </Button>
    )
}

export default function CashManager() {
    const [isOpenFormOpen, setIsOpenFormOpen] = useState(false)
    const [isCloseFormOpen, setIsCloseFormOpen] = useState(false)
    const [isMovementFormOpen, setIsMovementFormOpen] = useState(false)
    const [detailSession, setDetailSession] = useState<CashSessionWithPayments | null>(null)

    const { data: sessions, isLoading } = useGetCashSessions()
    const { paymentMethods, cashPaymentMethodIds } = useGetCashPaymentMethods()

    const openSession = (sessions ?? []).find((session) => !session.closed_at) ?? null
    const closedSessions = (sessions ?? []).filter((session) => !!session.closed_at)

    const openCount = openSession
        ? calculateCashCount({
            openingAmount: openSession.opening_amount,
            sales: openSession.payments,
            movements: openSession.movements,
            paymentMethods,
            cashPaymentMethodIds,
        })
        : null

    // "Abrir caja" del encabezado solo existe sin caja abierta (en celular queda solo el de
    // CajaClosedPage): PLAN-UI/vistas/admin-cash.md.
    const closed = !isLoading && openSession === null

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Caja"
                description="Apertura con monto inicial, ingresos y egresos, cierre con arqueo e historial de cierres."
                actions={closed
                    ? <span className="hidden md:inline-flex"><AbrirCajaButton onClick={() => setIsOpenFormOpen(true)} /></span>
                    : undefined}
            />

            {isLoading ? (
                <OpenSessionCardSkeleton />
            ) : openSession && openCount ? (
                <>
                    <OpenSessionCard
                        count={openCount}
                        openedAt={openSession.opened_at}
                        onRegisterMovement={() => setIsMovementFormOpen(true)}
                        onCloseSession={() => setIsCloseFormOpen(true)}
                    />
                    <CashMovementTable movements={openSession.movements} />
                </>
            ) : (
                <CajaClosedPage action={<AbrirCajaButton onClick={() => setIsOpenFormOpen(true)} />} />
            )}

            <section className="flex flex-col gap-3">
                <h2 className="text-lg font-bold md:text-2xl md:font-extrabold">Historial</h2>
                <CashSessionTable sessions={closedSessions} isLoading={isLoading} onShowDetail={setDetailSession} />
            </section>

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
