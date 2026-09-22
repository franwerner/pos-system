import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"
import { revertStockMovements } from "@/features/order/services/revertStockMovements.service"
import {
    findOrder,
    insertStockMovements,
    listSaleStockMovements,
    readOrderId,
    requirePendingOrder,
} from "@/features/order/server/order.repository"

export const runtime = "nodejs"

export const POST = authenticatedRoute({}, async ({ params }) => {
    const orderId = readOrderId(params)

    await requirePendingOrder(orderId)

    const reversal = revertStockMovements(await listSaleStockMovements(orderId))

    await insertStockMovements(orderId, reversal, `Cancelación del pedido #${orderId}`)

    const { error } = await getServerSupabase()
        .from("sale")
        .update({ status: "cancelled" })
        .eq("id", orderId)
        .eq("status", "pending")

    if (error) throw new Error(error.message)

    return findOrder(orderId)
})
