"use client"
import { useCart } from "@/features/cart/context/cart-context";
import OrderAmount from "@/features/order/components/order-amount.component";
import Ticket from "@/features/order/components/ticket.component";
import Linker from "@/shared/components/linker.component";
import { Button } from "@/shared/components/ui/button";
import formatCurrency from "@/shared/utils/formatCurrency.util";
import { Printer } from "lucide-react";

export default function PaymentSuccess() {

    const handlePrint = () => {
        window.print()
    }

    const { getCalculatedCart } = useCart()
    const { total } = getCalculatedCart()

    return (
        <main className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-md rounded-lg border flex flex-col gap-6 bg-white shadow-lg p-6">
                <Ticket receipt_number="123" />
                <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-700">Total</span>
                    <span className="text-lg font-semibold ">{formatCurrency(total)}</span>
                </div>
                <div className="flex flex-col gap-5 print:hidden">
                    <Button
                        onClick={handlePrint}
                        variant="outline"
                        className="w-full cursor-pointer flex items-center justify-center">
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir ticket
                    </Button>
                    <Button
                        asChild
                        className="w-full">
                        <Linker href="/pos">Volver al inicio</Linker>
                    </Button>
                </div>
            </div>
        </main>
    )
}