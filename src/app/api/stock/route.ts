import { isBelowMinimum } from "@/features/stock/services/calculateStock.service"
import { type SupplyStock } from "@/features/stock/types/stock.type"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"
import buildSearchTerm from "@/shared/utils/buildSearchTerm.util"

export const runtime = "nodejs"

const parseIds = (raw: string | null): number[] =>
    (raw ?? "")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0)

export const GET = authenticatedRoute({}, async ({ request }): Promise<SupplyStock[]> => {
    const params = request.nextUrl.searchParams
    const search = params.get("search")?.trim()
    const supplyIds = parseIds(params.get("supplyIds"))

    if (params.has("supplyIds") && supplyIds.length === 0) return []

    const query = getServerSupabase()
        .from("supply_stock")
        .select("*")
        .order("name")

    if (supplyIds.length > 0) query.in("supply_id", supplyIds)
    if (search) query.ilike("search_name", `%${buildSearchTerm(search)}%`)

    const { data, error } = await query

    if (error) throw new Error(error.message)

    const rows = (data ?? []) as SupplyStock[]

    // La vista no expone el mínimo y el stock como una comparación, así que el
    // filtro por faltante se resuelve acá y no en PostgREST.
    return params.get("onlyBelowMinimum") === "true"
        ? rows.filter((row) => isBelowMinimum(row.current_stock, row.min_stock))
        : rows
})
