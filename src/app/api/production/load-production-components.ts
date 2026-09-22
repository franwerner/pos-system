import { resolveComponentCost } from "@/features/production/services/calculateProductionCost.service"
import { type ProductionComponent } from "@/features/production/types/production.type"
import { type SupplyOrigin, type SupplyUnit } from "@/features/supplies/types/supply.type"
import { getServerSupabase } from "@/server/supabase"

export const fetchLastProductionCosts = async (supplyIds: number[]): Promise<Map<number, number>> => {
    if (supplyIds.length === 0) return new Map()

    const { data, error } = await getServerSupabase()
        .from("production")
        .select("supply_id, unit_cost, produced_at")
        .in("supply_id", supplyIds)
        .order("produced_at", { ascending: false })

    if (error) throw new Error(error.message)

    return (data ?? []).reduce((costs, row) => (
        costs.has(row.supply_id) ? costs : costs.set(row.supply_id, row.unit_cost)
    ), new Map<number, number>())
}

export const loadProductionComponents = async (
    supplyId: number,
): Promise<ProductionComponent[]> => {
    const { data, error } = await getServerSupabase()
        .from("supply_component")
        .select(
            "component_supply_id, quantity, supply:supply!supply_component_component_supply_id_fkey(name, unit, origin, purchase_price, yield_factor)",
        )
        .eq("parent_supply_id", supplyId)
        .order("id")

    if (error) throw new Error(error.message)

    const lines = (data ?? []).filter((line) => line.supply !== null)

    const producedIds = lines
        .filter((line) => line.supply.origin === "produced")
        .map((line) => line.component_supply_id)

    const lastCosts = await fetchLastProductionCosts(producedIds)

    return lines.map((line) => ({
        supply_id: line.component_supply_id,
        quantity: line.quantity,
        name: line.supply.name,
        unit: line.supply.unit as SupplyUnit,
        origin: line.supply.origin as SupplyOrigin,
        unit_cost: resolveComponentCost({
            origin: line.supply.origin as SupplyOrigin,
            purchase_price: line.supply.purchase_price,
            yield_factor: line.supply.yield_factor,
            last_production_unit_cost: lastCosts.get(line.component_supply_id) ?? null,
        }),
    }))
}
