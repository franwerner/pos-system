import { type ProductionComponent } from "@/features/production/types/production.type"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { loadProductionComponents } from "../load-production-components"

export const runtime = "nodejs"

export const GET = authenticatedRoute({}, async ({ request }): Promise<ProductionComponent[]> => {
    const supplyId = Number(request.nextUrl.searchParams.get("supplyId"))

    if (!Number.isInteger(supplyId) || supplyId <= 0) {
        throw new ApiError(400, "Falta el insumo preparado")
    }

    return loadProductionComponents(supplyId)
})
