import type { LucideIcon } from "lucide-react"
import { Check, Clock, X } from "lucide-react"
import { adjustmentLabel, describePaymentAdjustmentNote } from "@/features/payment/services/describeAdjustment.service"
import { Money } from "@/shared/components/money.component"
import { cn } from "@/shared/utils/cn.util"
import formatDate from "@/shared/utils/formatDate.util"
import { type Sale } from "../types/sale.type"

export interface TicketStatusInfo {
    title: string
    subtitle: string
    icon: LucideIcon
    /** Clases del círculo de ícono en pantalla (fondo + color). */
    tone: string
    totalLabel: string
    /** Rótulo del total en el comprobante impreso (el cancelado dice solo "Total"). */
    printTotalLabel: string
    /** Sello que solo aparece en el comprobante impreso, no en pantalla. */
    stamp?: string
}

/**
 * Presentación de cada estado: mismos textos del brief, un color/ícono reconocible de un
 * vistazo. `Record<string, ...>` porque `status` llega como `string` de la base (sin un enum
 * propio en `Sale`), no como el `OrderStatus` acotado que usa el resto de la app.
 */
const STATUS: Record<string, TicketStatusInfo> = {
    paid: {
        title: "Pago Exitoso",
        subtitle: "¡Gracias por tu compra!",
        icon: Check,
        tone: "bg-success-muted text-success-muted-foreground",
        totalLabel: "Total cobrado",
        printTotalLabel: "Total cobrado",
    },
    pending: {
        title: "Pedido pendiente",
        subtitle: "Todavía no está cobrado.",
        icon: Clock,
        tone: "bg-warning-muted text-warning-muted-foreground",
        totalLabel: "Total a cobrar",
        printTotalLabel: "Total a cobrar",
        stamp: "Pedido pendiente",
    },
    cancelled: {
        title: "Pedido cancelado",
        subtitle: "El stock volvió a como estaba.",
        icon: X,
        tone: "bg-destructive-muted text-destructive-muted-foreground",
        totalLabel: "Total (no se cobró)",
        printTotalLabel: "Total",
        stamp: "Pedido cancelado",
    },
}

/** `status` es texto libre en la base; si llega algo inesperado se muestra como pagado. */
export function resolveTicketStatus(status: string): TicketStatusInfo {
    return STATUS[status] ?? STATUS.paid
}

function Dashed() {
    return <hr className="w-full border-0 border-t border-dashed border-border" />
}

/** Montos del recibo al tamaño del texto que lo rodea (hereda de su contenedor). */
function LineAmount({ value, bold }: { value: number; bold?: boolean }) {
    return <Money value={value} size="sm" className={cn("text-[length:inherit]", bold ? "font-semibold" : "font-normal")} />
}

export interface TicketProps extends Sale {
    /** true = comprobante impreso (80mm): agrega el sello de estado y cambia el rótulo del total. */
    print?: boolean
}

/**
 * Cuerpo del recibo: compartido entre la tarjeta en pantalla (`order-ticket.view.tsx`) y el
 * comprobante impreso a 80mm (`print-receipt.component.tsx`). Es de solo lectura, sin mutaciones:
 * toda la data ya viene resuelta en el `Sale` que llega por props (`useGetOrder`).
 */
export default function Ticket({ created_at, id, items, payments, status, sub_total, tax, total, print }: TicketProps) {
    const s = resolveTicketStatus(status)
    // En pantalla el cancelado se tacha para remarcar que no se cobró; impreso queda limpio.
    const struck = status === "cancelled" && !print

    return (
        <>
            <div className="flex items-baseline justify-between gap-3">
                <span className="text-lg font-bold">Recibo #{id}</span>
                <span className="text-sm text-muted-foreground tabular-nums">{formatDate(created_at)}</span>
            </div>
            {print && s.stamp && (
                <div className="rounded-md border-[1.5px] border-foreground py-1.5 text-center text-[15px] font-extrabold uppercase tracking-[.04em]">
                    {s.stamp}
                </div>
            )}
            <Dashed />
            <div className="flex flex-col gap-2">
                {items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4">
                        <span>
                            {item.product.name} × {item.quantity}
                        </span>
                        <LineAmount value={item.unit_price * item.quantity} />
                    </div>
                ))}
            </div>
            <Dashed />
            <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <LineAmount value={sub_total} />
                </div>
                {/* Sin ajuste (tax 0) no hay nada que aclarar: antes siempre mostraba "Ajuste $0". */}
                {tax !== 0 && (
                    <div className="flex justify-between">
                        <span>{adjustmentLabel(tax)}</span>
                        <LineAmount value={tax} />
                    </div>
                )}
            </div>
            {payments.length > 0 && (
                <>
                    <Dashed />
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-bold uppercase tracking-[.06em] text-muted-foreground">
                            Pagado con
                        </span>
                        {payments.map((payment) => {
                            const note = describePaymentAdjustmentNote(
                                payment.payment_method?.tax ?? 0,
                                payment.surcharge_amount,
                            )
                            return (
                                <div key={payment.id} className="flex items-start justify-between">
                                    <div className="flex flex-col">
                                        <span>
                                            {payment.payment_method?.name ?? `Método #${payment.payment_method_id}`}
                                        </span>
                                        {note && <span className="text-[13px] text-muted-foreground">{note}</span>}
                                    </div>
                                    <LineAmount value={payment.amount + payment.surcharge_amount} bold />
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
            <Dashed />
            <div className="flex items-baseline justify-between gap-3">
                <span className="text-lg font-bold">{print ? s.printTotalLabel : s.totalLabel}</span>
                <Money
                    value={total}
                    size="lg"
                    className={cn(print && "text-2xl", struck && "line-through opacity-60")}
                />
            </div>
        </>
    )
}
