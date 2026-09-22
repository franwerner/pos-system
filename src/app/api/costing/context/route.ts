import { loadCostingContext } from "@/features/costing/server/costing-context"
import { currentMonth } from "@/features/fixed-costs/services/resolvePeriod.service"
import { type CostingContext } from "@/features/costing/types/costing.type"
import { authenticatedRoute } from "@/server/api/handler"

export const runtime = "nodejs"

const MONTH_PATTERN = /^\d{4}-\d{2}$/

// El formulario del producto costea en vivo mientras se escribe: necesita los
// mismos parámetros que el reporte, pero sin traerse todos los productos.
export const GET = authenticatedRoute({}, async ({ request }): Promise<CostingContext> => {
    const requested = request.nextUrl.searchParams.get("month")
    const month = requested && MONTH_PATTERN.test(requested) ? requested : currentMonth()

    return loadCostingContext(month)
})
