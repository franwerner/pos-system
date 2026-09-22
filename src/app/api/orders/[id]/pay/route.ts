import { z } from "zod"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"
import { requireOpenCashSession } from "@/features/cash/server/cash-session.repository"
import {
    calculateSalePayments,
    findPaymentsCoverageError,
} from "@/features/payment/services/calculateSalePayments.service"
import { loadActivePaymentMethods } from "@/features/payment/server/payment-method.repository"
import {
    findOrder,
    insertSalePayments,
    readOrderId,
    requirePendingOrder,
    resolveLegacyPaymentMethodId,
} from "@/features/order/server/order.repository"

export const runtime = "nodejs"

const payOrderSchema = z.object({
    payments: z.array(z.object({
        payment_method_id: z.number().int().positive("El método de pago es obligatorio"),
        amount: z.number().positive("El monto del pago debe ser mayor a 0"),
    })).min(1, "Registrá al menos un pago"),
})

export const POST = authenticatedRoute({ body: payOrderSchema }, async ({ params, body }) => {
    const orderId = readOrderId(params)
    const order = await requirePendingOrder(orderId)

    const paymentMethods = await loadActivePaymentMethods(
        body.payments.map((payment) => payment.payment_method_id),
    )

    const breakdown = calculateSalePayments(body.payments, paymentMethods, order.sub_total)
    const coverageError = findPaymentsCoverageError(breakdown)

    if (coverageError) throw new ApiError(400, coverageError)

    const cashSession = await requireOpenCashSession()

    await insertSalePayments(orderId, breakdown.lines)

    const { error } = await getServerSupabase()
        .from("sale")
        .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            cash_session_id: cashSession.id,
            payment_method_id: resolveLegacyPaymentMethodId(breakdown.lines),
            tax: breakdown.surchargeTotal,
            total: order.sub_total + breakdown.surchargeTotal,
        })
        .eq("id", orderId)
        .eq("status", "pending")

    if (error) {
        await getServerSupabase().from("sale_payment").delete().eq("sale_id", orderId)
        throw new Error(error.message)
    }

    return findOrder(orderId)
})
