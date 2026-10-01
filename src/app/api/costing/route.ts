import { buildProductCostings } from "@/features/costing/services/calculateProductCosting.service"
import { resolveSupplyUnitCost } from "@/features/costing/services/resolveSupplyUnitCost.service"
import { loadCostingContext } from "@/features/costing/server/costing-context"
import { loadMeasuredWaste } from "@/features/costing/server/measured-parameters"
import {
    type CostableProduct,
    type CostingReport,
} from "@/features/costing/types/costing.type"
import {
    type SupplyOrigin,
    type SupplyType,
    type SupplyUnit,
} from "@/features/supplies/types/supply.type"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"
import buildSearchTerm from "@/shared/utils/buildSearchTerm.util"
import { fetchLastProductionCosts } from "../production/load-production-components"

export const runtime = "nodejs"

const MONTH_PATTERN = /^\d{4}-\d{2}$/

const fetchCostableProducts = async (
    search: string | null,
): Promise<CostableProduct[]> => {
    const query = getServerSupabase()
        .from("product")
        .select(
            "id, name, price, target_margin_percentage, product_supply(supply_id, quantity, supply(name, type, unit, origin, purchase_price, yield_factor))",
        )
        .eq("is_active", true)
        .order("name")

    if (search) query.ilike("search_name", `%${buildSearchTerm(search)}%`)

    const { data, error } = await query

    if (error) throw new Error(error.message)

    const products = data ?? []

    const producedSupplyIds = products.flatMap((product) => product.product_supply
        .filter((line) => line.supply?.origin === "produced")
        .map((line) => line.supply_id))

    const lastCosts = await fetchLastProductionCosts([...new Set(producedSupplyIds)])

    return products.map((product) => ({
        product_id: product.id,
        name: product.name,
        price: product.price,
        target_margin_percentage: product.target_margin_percentage,
        lines: product.product_supply
            .filter((line) => line.supply !== null)
            .map((line) => ({
                supply_id: line.supply_id,
                name: line.supply.name,
                type: line.supply.type as SupplyType,
                unit: line.supply.unit as SupplyUnit,
                quantity: line.quantity,
                unit_cost: resolveSupplyUnitCost({
                    origin: line.supply.origin as SupplyOrigin,
                    purchase_price: line.supply.purchase_price,
                    yield_factor: line.supply.yield_factor,
                    last_production_unit_cost: lastCosts.get(line.supply_id) ?? null,
                }),
            })),
    }))
}

export const GET = authenticatedRoute({}, async ({ request }): Promise<CostingReport> => {
    const params = request.nextUrl.searchParams
    const month = params.get("month")

    if (!month || !MONTH_PATTERN.test(month)) {
        throw new ApiError(400, "El mes debe tener el formato AAAA-MM")
    }

    const context = await loadCostingContext()

    // Los costos fijos ya no se reparten por plato (ver PLAN/04-costos-fijos.md):
    // el reporte de costeo no necesita el total de fijos ni las unidades vendidas
    // del mes, solo lo que cuesta y deja cada plato.
    const [measuredWaste, products] = await Promise.all([
        loadMeasuredWaste(month, context.waste_percentages),
        fetchCostableProducts(params.get("search")?.trim() || null),
    ])

    try {
        return {
            ...context,
            month,
            // Lo medido es un indicador, no un parámetro: el costeo usa los
            // porcentajes declarados para que un corte de luz no mueva el costo
            // del plato.
            measured_waste: measuredWaste,
            rows: buildProductCostings(products, {
                wastePercentages: context.waste_percentages,
            }),
        }
    } catch (error) {
        // Los servicios de cálculo validan sus parámetros: su mensaje le dice al
        // usuario qué parámetro de costeo tiene que corregir.
        throw new ApiError(400, error instanceof Error ? error.message : "No se pudo costear")
    }
})
