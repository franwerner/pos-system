import { ApiError } from "@/server/api/api-error"
import { getServerSupabase } from "@/server/supabase"
import { resolveCostingConfig } from "../services/resolveCostingConfig.service"
import { type CostingContext } from "../types/costing.type"

const COSTING_CONFIG_COLUMNS =
    "waste_percentage_food, waste_percentage_drink, waste_percentage_packaging"

const readCostingConfig = async () => {
    const { data, error } = await getServerSupabase()
        .from("app_config")
        .select(COSTING_CONFIG_COLUMNS)
        .limit(1)
        .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) throw new ApiError(404, "No hay configuración cargada")

    return data
}

// Sin impuestos, comisiones ni costo fijo por plato (ver PLAN/01-modelo-de-costo.md),
// lo único que el costeo necesita del negocio son los porcentajes de pérdidas
// declarados: no dependen del mes que se esté mirando.
export const loadCostingContext = async (): Promise<CostingContext> => {
    const config = await readCostingConfig()
    const { wastePercentages } = resolveCostingConfig(config)

    return { waste_percentages: wastePercentages }
}
