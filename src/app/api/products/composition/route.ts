import { type ProductCompositionLine } from "@/features/stock/services/calculateSaleConsumption.service"
import { calculateSupplyCost } from "@/features/supplies/services/calculateSupplyCost.service"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"

export const runtime = "nodejs"

const parseIds = (raw: string | null): number[] =>
    (raw ?? "")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0)

export const GET = authenticatedRoute({}, async ({ request }): Promise<ProductCompositionLine[]> => {
    const productIds = parseIds(request.nextUrl.searchParams.get("productIds"))

    if (productIds.length === 0) return []

    const { data, error } = await getServerSupabase()
        .from("product_supply")
        .select("product_id, supply_id, quantity, supply(purchase_price, yield_factor)")
        .in("product_id", productIds)

    if (error) throw new Error(error.message)

    return (data ?? []).map((line) => ({
        product_id: line.product_id,
        supply_id: line.supply_id,
        quantity: line.quantity,
        unit_cost: line.supply
            ? calculateSupplyCost(line.supply.purchase_price, line.supply.yield_factor)
            : 0,
    }))
})
