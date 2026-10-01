import { ArrowDownUp, CircleCheck, LockKeyhole, Wallet } from "lucide-react"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import formatDate from "@/shared/utils/formatDate.util"
import { cn } from "@/shared/utils/cn.util"
import { type CashCount } from "../services/calculateCashCount.service"

interface SessionButtonsProps {
    className?: string
    onRegisterMovement: () => void
    onCloseSession: () => void
}

/** Celular: "Cerrar caja" arriba, ancho completo. Escritorio: [Registrar] [Cerrar caja]. */
function SessionButtons({ className, onRegisterMovement, onCloseSession }: SessionButtonsProps) {
    return (
        <div className={cn("flex flex-col-reverse gap-2.5 md:flex-row", className)}>
            <Button variant="outline" size="lg" className="h-12 w-full gap-2 md:w-auto md:text-base" onClick={onRegisterMovement}>
                <ArrowDownUp className="size-5" aria-hidden /> Registrar ingreso o egreso
            </Button>
            <Button size="lg" className="h-12 w-full gap-2 md:w-auto md:text-base" onClick={onCloseSession}>
                <LockKeyhole className="size-5" aria-hidden /> Cerrar caja
            </Button>
        </div>
    )
}

interface OpenSessionCardProps {
    count: CashCount
    openedAt: string
    onRegisterMovement: () => void
    onCloseSession: () => void
}

/** Tarjeta "Caja abierta": protagonista "Esperado en caja", con el resto de los datos alrededor. */
export default function OpenSessionCard({ count, openedAt, onRegisterMovement, onCloseSession }: OpenSessionCardProps) {
    const stats = [
        { label: "Monto inicial", value: formatCurrency(count.openingAmount) },
        { label: "Ventas en efectivo", value: formatCurrency(count.cashSalesTotal) },
        { label: "Ingresos", value: `+ ${formatCurrency(count.depositsTotal)}` },
        { label: "Egresos", value: `− ${formatCurrency(count.withdrawalsTotal)}` },
    ]

    return (
        <Card className="gap-0 overflow-hidden p-0">
            <div className="flex flex-col gap-2.5 p-4 md:flex-row md:items-start md:justify-between md:gap-6 md:px-6 md:py-[22px]">
                <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <Badge className="gap-1.5 rounded-full border-transparent bg-success-muted px-2.5 py-1 text-[13px] font-semibold text-success-muted-foreground">
                            <CircleCheck className="size-4" aria-hidden /> Caja abierta
                        </Badge>
                        <span className="text-sm text-muted-foreground">Desde el {formatDate(openedAt)}</span>
                    </div>
                    <span className="text-sm font-semibold md:mt-2">Esperado en caja</span>
                    <span className="text-5xl font-extrabold leading-none tracking-[-0.03em] tabular-nums md:text-[64px]">
                        {formatCurrency(count.expectedAmount)}
                    </span>
                    <span className="hidden max-w-[560px] text-sm text-muted-foreground md:block">
                        Lo que tendría que haber hoy en el cajón: monto inicial + ventas en efectivo + ingresos − egresos.
                    </span>
                </div>
                <SessionButtons className="hidden md:flex" onRegisterMovement={onRegisterMovement} onCloseSession={onCloseSession} />

                {/* Celular: los 6 datos como lista clave-valor + botones a lo ancho. */}
                <div className="flex flex-col border-t border-border pt-1 md:hidden">
                    {stats.map((stat) => (
                        <div key={stat.label} className="flex justify-between gap-4 py-2 text-[15px]">
                            <span>{stat.label}</span>
                            <span className="font-bold tabular-nums">{stat.value}</span>
                        </div>
                    ))}
                    <div className="flex justify-between gap-4 py-2 text-[15px] text-muted-foreground">
                        <span>
                            Otros métodos <span className="text-xs">(no entra al arqueo)</span>
                        </span>
                        <span className="font-bold tabular-nums">{formatCurrency(count.otherSalesTotal)}</span>
                    </div>
                </div>
                <SessionButtons className="md:hidden" onRegisterMovement={onRegisterMovement} onCloseSession={onCloseSession} />
            </div>

            {/* Escritorio: franja de datos. */}
            <div className="hidden border-t border-border bg-muted md:grid md:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.1fr)]">
                {stats.map((stat) => (
                    <div key={stat.label} className="flex flex-col gap-1 px-[18px] py-3.5">
                        <span className="text-sm font-semibold text-muted-foreground">{stat.label}</span>
                        <span className="text-[22px] font-extrabold tabular-nums">{stat.value}</span>
                    </div>
                ))}
                <div className="flex flex-col gap-1 border-l border-dashed border-border px-[18px] py-3.5">
                    <span className="text-sm font-semibold text-muted-foreground">Otros métodos</span>
                    <span className="text-[22px] font-extrabold text-muted-foreground tabular-nums">
                        {formatCurrency(count.otherSalesTotal)}
                    </span>
                    <span className="text-xs text-muted-foreground">no entra al arqueo</span>
                </div>
            </div>
        </Card>
    )
}

/** Estado "Cargando" de la tarjeta de caja abierta, mientras `useGetCashSessions` resuelve. */
export function OpenSessionCardSkeleton() {
    return (
        <Card aria-busy="true" aria-label="Cargando" className="flex flex-col gap-4 p-6">
            <Skeleton className="h-[22px] w-[280px] max-w-full" />
            <Skeleton className="h-14 w-[260px] max-w-full" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                {[0, 1, 2, 3, 4].map((index) => <Skeleton key={index} className="h-12" />)}
            </div>
        </Card>
    )
}
