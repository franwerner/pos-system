import { Payment } from "@/features/payment/types/payment.type"

const paymentsData: Payment[] = [
    {
        id: 1,
        name: "Efectivo",
        tax: 0,
        is_active: true,
    },
    {
        id: 2,
        name: "Tarjeta de Credito",
        tax: 10,
        is_active: true,
    },
    {
        id: 3,
        name: "Transferencia",
        tax: 10,
        is_active: true,
    }
]

export default paymentsData
