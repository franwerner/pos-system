import formatCurrency from "@/shared/utils/formatCurrency.util";
import { Check, Clock, X } from "lucide-react";
import { adjustmentLabel } from "@/features/payment/services/describeAdjustment.service";
import { type SaleItem } from "../types/sale-item.type";
import { type Sale } from "../types/sale.type";

const TicketItem = ({ product, quantity, unit_price }: SaleItem) => {
    return (
        <div className="flex justify-between">
            <p className="text-gray-700">
                {product.name} × {quantity}
            </p>
            <p className="text-gray-700">
                {formatCurrency(unit_price * quantity)}
            </p>
        </div>
    )
}

const TICKET_HEADINGS = {
    paid: {
        icon: Check,
        tone: "bg-green-100 text-green-600",
        title: "Pago Exitoso",
        subtitle: "¡Gracias por tu compra!",
    },
    pending: {
        icon: Clock,
        tone: "bg-amber-100 text-amber-600",
        title: "Pedido pendiente",
        subtitle: "Todavía no está cobrado.",
    },
    cancelled: {
        icon: X,
        tone: "bg-red-100 text-red-600",
        title: "Pedido cancelado",
        subtitle: "El stock volvió a como estaba.",
    },
} as const

export default function Ticket({
    created_at,
    id,
    items,
    payments,
    status,
    sub_total,
    tax,
    total,
}: Sale) {
    const heading = TICKET_HEADINGS[status as keyof typeof TICKET_HEADINGS] ?? TICKET_HEADINGS.paid
    const HeadingIcon = heading.icon

    return (
        <div className="">
            <div className="mb-6 flex items-center justify-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${heading.tone}`}>
                    <HeadingIcon className="h-6 w-6" />
                </div>
            </div>
            <h1 className="mb-2 text-center text-2xl font-bold text-gray-800">
                {heading.title}
            </h1>
            <p className="mb-6 text-center text-gray-500">
                {heading.subtitle}
            </p>
            <div className="mb-6 text-center">
                <p className="font-medium">
                    Recibo #{id}
                </p>
                <p className="text-sm text-gray-400">
                    {new Date(created_at).toLocaleString()}
                </p>
            </div>
            <hr className="my-2" />
            <div className="space-y-3">
                {items.map((item) => (
                    <TicketItem key={item.id} {...item} />
                ))}
            </div>
            <hr className="my-2" />
            <div className="space-y-1">
                <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(sub_total)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>{adjustmentLabel(tax)}</span>
                    <span>{formatCurrency(tax)}</span>
                </div>
            </div>
            {payments.length > 0 && (
                <>
                    <hr className="my-2" />
                    <div className="space-y-1">
                        {payments.map((payment) => (
                            <div
                                key={payment.id}
                                className="flex justify-between items-center text-sm text-gray-600">
                                <span>
                                    {payment.payment_method?.name ?? `Método #${payment.payment_method_id}`}
                                    {payment.surcharge_amount !== 0
                                        && ` (${payment.surcharge_amount > 0 ? "+" : ""}${formatCurrency(payment.surcharge_amount)})`}
                                </span>
                                <span>
                                    {formatCurrency(payment.amount + payment.surcharge_amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
            <hr className="my-2" />
            <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">Total</span>
                <span className="text-lg font-semibold ">{formatCurrency(total)}</span>
            </div>
        </div>
    )
}
