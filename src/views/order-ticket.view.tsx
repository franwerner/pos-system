"use client"
import Ticket from "@/features/order/components/ticket.component";
import useGetOrder from "@/features/order/hooks/useGetOrder.hook";
import Linker from "@/shared/components/linker.component";
import { Loader } from "@/shared/components/loader.component";
import { Button } from "@/shared/components/ui/button";
import { Printer } from "lucide-react";
import { notFound } from "next/navigation";

export default function OrderTicketView({ orderId }: { orderId: number }) {

    const handlePrint = () => {
        window.print()
    }

    const { data: order, isLoading } = useGetOrder(orderId)

    if (isLoading) return <Loader className="h-screen" />
    if (!order) return notFound()

    return (
        <main className="flex items-center w-full justify-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-md rounded-lg border flex flex-col gap-6 bg-white shadow-lg p-6">
                <Ticket {...order} />
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