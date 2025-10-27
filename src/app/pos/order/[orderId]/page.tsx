import OrderTicketView from "@/views/order-ticket.view";

export default async function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
    const { orderId } = await params
    return (
        <OrderTicketView orderId={Number(orderId)} />
    )
}