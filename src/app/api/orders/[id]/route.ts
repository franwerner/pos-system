import { authenticatedRoute } from "@/server/api/handler"
import { readOrderId, requireOrder } from "@/features/order/server/order.repository"

export const runtime = "nodejs"

export const GET = authenticatedRoute({}, async ({ params }) => requireOrder(readOrderId(params)))
