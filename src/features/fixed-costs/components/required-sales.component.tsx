"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { CalendarDays, Hourglass, Target, TriangleAlert, UtensilsCrossed } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Card } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/utils/cn.util"
import { Money } from "@/shared/components/money.component"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import useGetCosting from "@/features/costing/hooks/useGetCosting.hook"
import { calculateBreakEvenUnits } from "../services/calculateBreakEvenUnits.service"
import { formatPeriod, toPeriodDate } from "../services/resolvePeriod.service"

/*
 * Bloque "Necesitás vender" (punto de equilibrio). Va antes que todo lo demás:
 * es la pregunta que responde toda la pantalla (PLAN/04-costos-fijos.md).
 * 4 estados mutuamente excluyentes, cada uno con su propio tono:
 *   sin costos (neutro, punteado) · sin costeables (azul) · precios no cubren (rojo) · normal (número enorme).
 * Decisión de integración: el bloque sigue el mes del selector (no queda fijo
 * en el mes en curso como en el export) — por eso la bajada siempre nombra el
 * mes que se está mirando, para que nunca quede ambiguo a qué mes se refiere.
 */

const formatUnits = (units: number): string => new Intl.NumberFormat("es-AR").format(units)

interface RequiredSalesProps {
    fixedCostTotal: number
    month: string
}

function Kicker({ className }: { className?: string }) {
    return (
        <p className={cn("flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.06em] text-muted-foreground", className)}>
            <Target className="size-4" aria-hidden />
            Cuánto necesitás vender · punto de equilibrio
        </p>
    )
}

interface NoticeProps {
    tone: "neutral" | "info" | "danger"
    icon: LucideIcon
    title: string
    text: ReactNode
    action: ReactNode
}

function BreakEvenNotice({ tone, icon: Icon, title, text, action }: NoticeProps) {
    const toneText =
        tone === "info" ? "text-info-muted-foreground" : tone === "danger" ? "text-destructive-muted-foreground" : "text-foreground"

    return (
        <section
            role={tone === "danger" ? "alert" : "status"}
            className={cn(
                "flex flex-col gap-3 rounded-xl p-5 md:min-h-[220px] md:flex-row md:items-start md:gap-6 md:px-8 md:py-7",
                tone === "neutral" && "border-[1.5px] border-dashed border-input bg-card",
                tone === "info" && "bg-info-muted",
                tone === "danger" && "bg-destructive-muted",
            )}
        >
            <div
                className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-2xl md:size-16",
                    tone === "neutral" ? "bg-muted text-foreground" : "bg-card",
                    toneText,
                )}
            >
                <Icon className="size-6 md:size-8" aria-hidden />
            </div>
            <div className="flex min-w-0 flex-col gap-2.5">
                <Kicker className={tone === "neutral" ? undefined : toneText} />
                <h2 className={cn("text-2xl font-extrabold leading-[1.15] tracking-[-0.015em] md:text-[34px]", toneText)}>{title}</h2>
                <p className={cn("max-w-[680px] text-[15px] md:text-[17px]", toneText)}>{text}</p>
                {action && <div className="self-start">{action}</div>}
            </div>
        </section>
    )
}

function ProductsLink({ label }: { label: string }) {
    return (
        <Button asChild variant="outline" className="h-11 text-foreground md:h-10">
            <Link href="/admin/products">
                <UtensilsCrossed className="size-4" aria-hidden />
                {label}
            </Link>
        </Button>
    )
}

/** Estado "Cargando" del bloque: mientras `useGetCosting` todavía no resolvió. */
export function RequiredSalesSkeleton() {
    return (
        <Card aria-busy="true" aria-label="Cargando punto de equilibrio" className="flex flex-col gap-3.5 p-5 md:px-8 md:py-7">
            <Skeleton className="h-3.5 w-[260px] max-w-full" />
            <Skeleton className="h-[26px] w-[200px]" />
            <Skeleton className="h-[100px] w-[560px] max-w-full" />
            <Skeleton className="h-3.5 w-[640px] max-w-full" />
            <Skeleton className="h-3.5 w-[480px] max-w-full" />
        </Card>
    )
}

export default function RequiredSales({ fixedCostTotal, month }: RequiredSalesProps) {
    const { data: report, isLoading } = useGetCosting(month)
    const monthLabel = formatPeriod(toPeriodDate(month))

    if (isLoading || !report) return <RequiredSalesSkeleton />

    if (fixedCostTotal === 0) {
        return (
            <BreakEvenNotice
                tone="neutral"
                icon={CalendarDays}
                title="¿Cuántos platos necesitás vender?"
                text={`Cargá los costos fijos de ${monthLabel} para ver cuánto necesitás vender para cubrirlos.`}
                action={null}
            />
        )
    }

    const costableRows = report.rows.filter((row) => row.costing !== null)
    const uncostableCount = report.rows.length - costableRows.length
    const contributionMargins = costableRows.map((row) => row.costing!.contribution_margin)

    const breakEven = calculateBreakEvenUnits({ fixedCostTotal, contributionMargins })

    if (breakEven.status === "no_costable_products") {
        return (
            <BreakEvenNotice
                tone="info"
                icon={Hourglass}
                title="Todavía no se puede calcular cuánto vender"
                text="Ningún producto tiene insumos cargados todavía, así que no se sabe cuánto deja cada venta ni cuánto hay que vender para cubrir estos costos."
                action={<ProductsLink label="Ir a Productos" />}
            />
        )
    }

    if (breakEven.status === "no_contribution") {
        return (
            <BreakEvenNotice
                tone="danger"
                icon={TriangleAlert}
                title="Ninguna cantidad de ventas cubre estos costos"
                text="Con los precios de hoy una venta promedio no deja nada después de pagar los insumos: no hay cantidad de ventas que cubra estos costos. Revisá los precios de la carta."
                action={<ProductsLink label="Revisar precios en Productos" />}
            />
        )
    }

    const footnote = uncostableCount > 0
        ? `Promedio de los ${costableRows.length} productos con insumos cargados; ${uncostableCount} producto${uncostableCount === 1 ? "" : "s"} todavía sin costear no entra${uncostableCount === 1 ? "" : "n"}. Siempre se redondea hacia arriba.`
        : `Promedio de los ${costableRows.length} productos con insumos cargados. Siempre se redondea hacia arriba.`

    return (
        <Card
            aria-label="Punto de equilibrio"
            className="grid gap-4 border-2 border-brand p-5 md:grid-cols-[minmax(0,1fr)_360px] md:items-center md:gap-10 md:px-8 md:py-7"
        >
            <div className="flex flex-col gap-1.5 md:gap-2.5">
                <Kicker />
                <h2 className="flex flex-col gap-0.5 font-extrabold text-foreground md:gap-1">
                    <span className="text-xl font-bold leading-tight md:text-[28px]">Necesitás vender</span>
                    <span className="flex flex-wrap items-baseline gap-x-2.5 md:gap-x-[18px]">
                        <span className="text-[88px] leading-[0.92] tracking-[-0.045em] tabular-nums md:text-[128px]">
                            {formatUnits(breakEven.units!)}
                        </span>
                        <span className="text-[26px] leading-[1.1] tracking-[-0.015em] md:text-[44px]">platos en {monthLabel}</span>
                    </span>
                </h2>
                <p className="mt-1.5 max-w-[640px] text-[15px] md:mt-2 md:text-base">
                    Con estos costos fijos y el margen promedio de tu carta, eso es lo que hace falta para cubrirlos. Cada venta
                    deja en promedio{" "}
                    <strong className="tabular-nums">{formatCurrency(breakEven.average_contribution_margin)}</strong> después de
                    los insumos.{" "}
                    <span className="text-muted-foreground">
                        Este número todavía no descuenta impuestos ni comisiones: para eso está el margen objetivo.
                    </span>
                </p>
                <span className="text-xs text-muted-foreground">{monthLabel} · con los precios de hoy</span>
            </div>

            {/* Desglose: solo escritorio (en celular el bloque queda con el número y el párrafo). */}
            <div className="hidden flex-col rounded-[14px] bg-muted px-[18px] py-4 md:flex">
                <p className="mb-1.5 text-sm font-semibold">Cómo sale este número</p>
                <div className="flex justify-between gap-4 py-2 text-[15px]">
                    <span>Costos fijos de {monthLabel}</span>
                    <span className="font-bold tabular-nums">{formatCurrency(fixedCostTotal)}</span>
                </div>
                <div className="flex justify-between gap-4 py-2 text-[15px]">
                    <span>÷ Deja cada venta, en promedio</span>
                    <span className="font-bold tabular-nums">{formatCurrency(breakEven.average_contribution_margin)}</span>
                </div>
                <div className="mt-1 flex justify-between gap-4 border-t border-border pt-3 pb-1 text-[15px] font-extrabold">
                    <span>= Platos a vender</span>
                    <span className="tabular-nums">{formatUnits(breakEven.units!)}</span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{footnote}</p>
            </div>
        </Card>
    )
}
