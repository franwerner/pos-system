import { Order } from "@/features/order/types/order.type";
import { calculateTax } from "@/features/payment/services/calculateTax.service";
import formatCurrency from "@/shared/utils/formatCurrency.util";
import { Check } from "lucide-react";
import { OrderProduct } from "../types/order-products.type";

const TicketProduct = ({
    name,
    quantity,
    price,
    tax
}: OrderProduct & { tax: number }) => {
    return (
        <div className="flex justify-between">
            <p className="text-gray-700">
                {name} × {quantity}
            </p>
            <p className="text-gray-700">
                {formatCurrency(calculateTax(price * quantity, tax).total)}
            </p>
        </div>
    )
}

export default function Ticket({
    created_at,
    id,
    products,
    sub_total,
    tax,
}: Order) {
    return (
        <div className="">
            <div className="mb-6 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-6 w-6 text-green-600" />
                </div>
            </div>
            <h1 className="mb-2 text-center text-2xl font-bold text-gray-800">
                Pago Exitoso
            </h1>
            <p className="mb-6 text-center text-gray-500">
                ¡Gracias por tu compra!
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
                {products.map((item) => (
                    <TicketProduct key={item.id} {...item} tax={tax} />
                ))}
            </div>
            <hr className="my-2" />
            <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">Total</span>
                <span className="text-lg font-semibold ">{formatCurrency(calculateTax(sub_total, tax).total)}</span>
            </div>
        </div>
    )
}