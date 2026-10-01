"use client"

import { House, Loader2, Printer, Receipt } from "lucide-react"
import Ticket, { resolveTicketStatus } from "@/features/order/components/ticket.component"
import { PrintReceipt } from "@/features/order/components/print-receipt.component"
import useGetOrder from "@/features/order/hooks/useGetOrder.hook"
import { EmptyState } from "@/shared/components/empty-state.component"
import Linker from "@/shared/components/linker.component"
import { Money } from "@/shared/components/money.component"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/utils/cn.util"

/**
 * Comprobante final de un pedido: se llega automáticamente después de cobrar (ver
 * `pay-order-dialog.component.tsx`) o entrando directo a la URL. Es de solo lectura, sin
 * mutaciones: estado, total y recibo salen enteros de `useGetOrder`.
 */
export default function OrderTicketView({ orderId }: { orderId: number }) {
    const { data: order, isLoading } = useGetOrder(orderId)

    if (isLoading) {
        return (
            <main
                className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background text-foreground"
                role="status"
            >
                <Loader2 className="size-10 animate-spin text-muted-foreground" aria-hidden />
                <span className="text-lg font-bold">Cargando el ticket…</span>
            </main>
        )
    }

    // 404 con diseño propio en vez de `notFound()`: no hay forma de reproducir el 404 genérico
    // de Next con los tokens/copy del diseño, y este estado no necesita ningún cambio de esquema.
    if (!order) {
        return (
            <main className="flex min-h-dvh items-center justify-center bg-background p-6">
                <EmptyState
                    icon={Receipt}
                    variant="plain"
                    size="lg"
                    title="No encontramos este pedido"
                    description="Puede que el número esté mal escrito o que el enlace sea viejo."
                    action={
                        <Button asChild className="mt-1 h-16 gap-2 rounded-[14px] px-7 text-xl font-extrabold">
                            <Linker href="/pos">
                                <House className="size-6" aria-hidden />
                                Volver al inicio
                            </Linker>
                        </Button>
                    }
                />
            </main>
        )
    }

    const s = resolveTicketStatus(order.status)
    const Icon = s.icon
    const struck = order.status === "cancelled"

    return (
        <>
            {/* `print:hidden`: al imprimir solo queda `PrintReceipt`, ver más abajo. */}
            <main className="grid min-h-dvh items-center gap-12 bg-background px-6 py-12 text-foreground md:px-16 lg:grid-cols-[minmax(0,1fr)_480px] print:hidden">
                <div className="flex flex-col items-center gap-7">
                    <div className="flex flex-col items-center gap-3.5 text-center">
                        <span className={cn("flex size-24 items-center justify-center rounded-full", s.tone)}>
                            <Icon className="size-10" aria-hidden />
                        </span>
                        <div className="flex flex-col gap-1.5">
                            <h1 className="text-4xl font-extrabold tracking-tight">{s.title}</h1>
                            <p className="text-lg text-muted-foreground">{s.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-semibold text-muted-foreground">{s.totalLabel}</span>
                        <Money
                            value={order.total}
                            size="xl"
                            className={cn("text-[64px]", struck && "line-through opacity-55")}
                        />
                    </div>
                    <div className="flex w-full max-w-[420px] flex-col gap-3">
                        <Button asChild className="h-16 w-full gap-2 rounded-[14px] px-7 text-xl font-extrabold">
                            <Linker href="/pos">
                                <House className="size-6" aria-hidden />
                                Volver al inicio
                            </Linker>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.print()}
                            className="h-16 w-full gap-2 rounded-[14px] px-7 text-xl font-extrabold print:hidden"
                        >
                            <Printer className="size-6" aria-hidden />
                            Imprimir ticket
                        </Button>
                    </div>
                </div>

                <section
                    aria-label="Ticket"
                    className="flex w-full max-w-[480px] flex-col gap-3.5 justify-self-center rounded-b-md rounded-t-[18px] border border-border bg-card p-7 text-base text-card-foreground shadow-sm"
                >
                    <Ticket {...order} />
                </section>
            </main>
            <PrintReceipt order={order} />
        </>
    )
}
