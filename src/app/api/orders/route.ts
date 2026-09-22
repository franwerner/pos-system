import { z } from "zod"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"
import { requireOpenCashSession } from "@/features/cash/server/cash-session.repository"
import {
    calculateSalePayments,
    findPaymentsCoverageError,
    type SalePaymentLine,
} from "@/features/payment/services/calculateSalePayments.service"
import { loadActivePaymentMethods } from "@/features/payment/server/payment-method.repository"
import { calculateOrderSubTotal } from "@/features/order/services/calculateOrderSubTotal.service"
import {
    calculateOrderConsumption,
    findOrder,
    insertSalePayments,
    insertStockMovements,
    listOrders,
    priceOrderItems,
    resolveDefaultEmployeeId,
    resolveLegacyPaymentMethodId,
    rollbackSale,
} from "@/features/order/server/order.repository"
import { type OrderStatus } from "@/features/order/types/sale.type"

export const runtime = "nodejs"

const orderStatuses = ["pending", "paid", "cancelled"] as const

const createOrderSchema = z.object({
    items: z.array(z.object({
        product_id: z.number().int().positive("El producto es obligatorio"),
        quantity: z.number().positive("La cantidad debe ser mayor a 0"),
    })).min(1, "El pedido no tiene productos"),
    status: z.enum(["pending", "paid"]).default("pending"),
    payments: z.array(z.object({
        payment_method_id: z.number().int().positive("El método de pago es obligatorio"),
        amount: z.number().positive("El monto del pago debe ser mayor a 0"),
    })).default([]),
})

export const GET = authenticatedRoute({}, async ({ request }) => {
    const status = request.nextUrl.searchParams.get("status")

    if (status && !orderStatuses.includes(status as OrderStatus)) {
        throw new ApiError(400, "El estado del pedido no es válido")
    }

    return listOrders((status ?? undefined) as OrderStatus | undefined)
})

export const POST = authenticatedRoute({ body: createOrderSchema }, async ({ body }) => {
    const items = await priceOrderItems(body.items)
    const subTotal = calculateOrderSubTotal(items)
    const isPaid = body.status === "paid"

    let paymentLines: SalePaymentLine[] = []
    let surchargeTotal = 0
    let cashSessionId: number | null = null

    if (isPaid) {
        const paymentMethods = await loadActivePaymentMethods(
            body.payments.map((payment) => payment.payment_method_id),
        )

        const breakdown = calculateSalePayments(body.payments, paymentMethods, subTotal)
        const coverageError = findPaymentsCoverageError(breakdown)

        if (coverageError) throw new ApiError(400, coverageError)

        paymentLines = breakdown.lines
        surchargeTotal = breakdown.surchargeTotal
        cashSessionId = (await requireOpenCashSession()).id
    } else if (body.payments.length > 0) {
        throw new ApiError(400, "Un pedido pendiente no puede registrar pagos")
    }

    const employeeId = await resolveDefaultEmployeeId()

    const { data: sale, error: saleError } = await getServerSupabase()
        .from("sale")
        .insert({
            employee_id: employeeId,
            cash_session_id: cashSessionId,
            payment_method_id: resolveLegacyPaymentMethodId(paymentLines),
            status: body.status,
            paid_at: isPaid ? new Date().toISOString() : null,
            sub_total: subTotal,
            tax: surchargeTotal,
            total: subTotal + surchargeTotal,
        })
        .select("id")
        .single()

    if (saleError) throw new Error(saleError.message)

    try {
        const { error: itemsError } = await getServerSupabase()
            .from("sale_item")
            .insert(items.map((item) => ({ ...item, sale_id: sale.id })))

        if (itemsError) throw new Error(itemsError.message)

        await insertSalePayments(sale.id, paymentLines)

        // El pedido descuenta stock apenas se toma: la comida se prepara aunque
        // todavía no se haya cobrado.
        await insertStockMovements(sale.id, await calculateOrderConsumption(items))
    } catch (error) {
        await rollbackSale(sale.id)
        throw error
    }

    return findOrder(sale.id)
})
