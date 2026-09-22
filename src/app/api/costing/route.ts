import { buildProductCostings } from "@/features/costing/services/calculateProductCosting.service"
import { resolveMonthRange } from "@/features/costing/services/resolveMonthRange.service"
import { resolveSupplyUnitCost } from "@/features/costing/services/resolveSupplyUnitCost.service"
import {
    calculateWastePercentage,
    type CostedMovement,
} from "@/features/costing/services/calculateWastePercentage.service"
import { loadCostingContext } from "@/features/costing/server/costing-context"
import {
    type CostableProduct,
    type CostingReport,
} from "@/features/costing/types/costing.type"
import { calculateFixedCostTotal } from "@/features/fixed-costs/services/calculateFixedCostTotal.service"
import { toPeriodDate } from "@/features/fixed-costs/services/resolvePeriod.service"
import { type StockMovementType } from "@/features/stock/types/stock.type"
import {
    type SupplyOrigin,
    type SupplyType,
    type SupplyUnit,
} from "@/features/supplies/types/supply.type"
import { type TaxContext } from "@/features/taxes/types/tax.type"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"
import buildSearchTerm from "@/shared/utils/buildSearchTerm.util"
import { fetchLastProductionCosts } from "../production/load-production-components"

export const runtime = "nodejs"

const MONTH_PATTERN = /^\d{4}-\d{2}$/

const COSTED_MOVEMENT_TYPES: StockMovementType[] = ["waste", "sale", "production_out"]

const fetchCostableProducts = async (
    search: string | null,
    tax: TaxContext,
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
                }, tax),
            })),
    }))
}

const fetchMonthlySoldUnits = async (month: string): Promise<number> => {
    const { from, to } = resolveMonthRange(month)

    const { data, error } = await getServerSupabase()
        .from("sale_item")
        .select("quantity, sale!inner(created_at)")
        .gte("sale.created_at", from)
        .lt("sale.created_at", to)

    if (error) throw new Error(error.message)

    return (data ?? []).reduce((units, item) => units + item.quantity, 0)
}

const fetchCostedMovements = async (month: string): Promise<CostedMovement[]> => {
    const { from, to } = resolveMonthRange(month)

    const { data, error } = await getServerSupabase()
        .from("stock_movement")
        .select("type, quantity, unit_cost")
        .in("type", COSTED_MOVEMENT_TYPES)
        .gte("created_at", from)
        .lt("created_at", to)

    if (error) throw new Error(error.message)

    return (data ?? []) as CostedMovement[]
}

const fetchFixedCostTotal = async (month: string): Promise<number> => {
    const { data, error } = await getServerSupabase()
        .from("fixed_cost")
        .select("amount")
        .eq("period", toPeriodDate(month))

    if (error) throw new Error(error.message)

    return calculateFixedCostTotal(data ?? [])
}

export const GET = authenticatedRoute({}, async ({ request }): Promise<CostingReport> => {
    const params = request.nextUrl.searchParams
    const month = params.get("month")

    if (!month || !MONTH_PATTERN.test(month)) {
        throw new ApiError(400, "El mes debe tener el formato AAAA-MM")
    }

    const context = await loadCostingContext(month)

    const [fixedCostTotal, soldUnits, movements, products] = await Promise.all([
        fetchFixedCostTotal(month),
        fetchMonthlySoldUnits(month),
        fetchCostedMovements(month),
        fetchCostableProducts(params.get("search")?.trim() || null, context.tax),
    ])

    try {
        return {
            ...context,
            month,
            sold_units: soldUnits,
            fixed_cost_total: fixedCostTotal,
            // Lo medido es un indicador, no un parámetro: el costeo usa los
            // porcentajes configurados para que un corte de luz no mueva el costo
            // del plato.
            measured_waste: calculateWastePercentage(movements, context.waste_percentages.food),
            rows: buildProductCostings(products, {
                wastePercentages: context.waste_percentages,
                fixedCostPerUnit: context.fixed_cost_per_unit.amount_per_unit,
                tax: context.tax,
            }),
        }
    } catch (error) {
        // Los servicios de cálculo validan sus parámetros: su mensaje le dice al
        // usuario qué parámetro de costeo tiene que corregir.
        throw new ApiError(400, error instanceof Error ? error.message : "No se pudo costear")
    }
})
