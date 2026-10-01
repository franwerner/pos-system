import { loadCostingContext } from "@/features/costing/server/costing-context"
import { type CostingContext } from "@/features/costing/types/costing.type"
import { authenticatedRoute } from "@/server/api/handler"

export const runtime = "nodejs"

// El formulario del producto costea en vivo mientras se escribe: necesita los mismos
// porcentajes de pérdidas que usa el reporte, sin traerse todos los productos.
export const GET = authenticatedRoute({}, async (): Promise<CostingContext> => loadCostingContext())
