import { loadCostingContext } from "@/features/costing/server/costing-context"
import { loadMeasuredParameters } from "@/features/costing/server/measured-parameters"
import { type MeasuredParameters } from "@/features/costing/types/costing.type"
import { currentMonth } from "@/features/fixed-costs/services/resolvePeriod.service"
import { authenticatedRoute } from "@/server/api/handler"

export const runtime = "nodejs"

const MONTH_PATTERN = /^\d{4}-\d{2}$/

// Lo medido del período, para mostrarlo al lado de lo declarado en las pantallas que
// lo dejan adoptar. No entra en ningún cálculo: el costeo trabaja con lo declarado.
export const GET = authenticatedRoute({}, async ({ request }): Promise<MeasuredParameters> => {
    const requested = request.nextUrl.searchParams.get("month")
    const month = requested && MONTH_PATTERN.test(requested) ? requested : currentMonth()

    const { waste_percentages: wastePercentages } = await loadCostingContext()

    return loadMeasuredParameters(month, wastePercentages)
})
