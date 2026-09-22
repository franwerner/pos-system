import { z } from "zod"
import { resolveComponentCost } from "@/features/production/services/calculateProductionCost.service"
import { resolveMovementQuantity } from "@/features/stock/services/calculateStock.service"
import {
    MANUAL_MOVEMENT_TYPES,
    MOVEMENT_DIRECTIONS,
    type StockMovement,
} from "@/features/stock/types/stock.type"
import { type SupplyOrigin } from "@/features/supplies/types/supply.type"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"

export const runtime = "nodejs"

const createMovementSchema = z.object({
    supply_id: z.number().int().positive(),
    type: z.enum(MANUAL_MOVEMENT_TYPES),
    quantity: z.number().positive("La cantidad debe ser mayor a 0"),
    direction: z.enum(MOVEMENT_DIRECTIONS),
    note: z.string().nullable().default(null),
})

export const GET = authenticatedRoute({}, async ({ request }): Promise<StockMovement[]> => {
    const supplyId = Number(request.nextUrl.searchParams.get("supplyId"))

    const query = getServerSupabase()
        .from("stock_movement")
        .select("*")
        .order("created_at", { ascending: false })

    if (Number.isInteger(supplyId) && supplyId > 0) query.eq("supply_id", supplyId)

    const { data, error } = await query

    if (error) throw new Error(error.message)

    return (data ?? []) as StockMovement[]
})

const fetchLastProductionCost = async (supplyId: number): Promise<number | null> => {
    const { data, error } = await getServerSupabase()
        .from("production")
        .select("unit_cost")
        .eq("supply_id", supplyId)
        .order("produced_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) throw new Error(error.message)

    return data?.unit_cost ?? null
}

export const POST = authenticatedRoute(
    { body: createMovementSchema },
    async ({ body }): Promise<StockMovement> => {
        const supabase = getServerSupabase()

        const { data: supply, error: supplyError } = await supabase
            .from("supply")
            .select("id, origin, purchase_price, yield_factor")
            .eq("id", body.supply_id)
            .maybeSingle()

        if (supplyError) throw new Error(supplyError.message)
        if (!supply) throw new ApiError(404, "El insumo no existe")

        const origin = supply.origin as SupplyOrigin

        // Sin costo el movimiento no se puede valuar después: la merma del mes se
        // mide en plata, no en unidades.
        const unitCost = resolveComponentCost({
            origin,
            purchase_price: supply.purchase_price,
            yield_factor: supply.yield_factor,
            last_production_unit_cost: origin === "produced"
                ? await fetchLastProductionCost(supply.id)
                : null,
        })

        const { data, error } = await supabase
            .from("stock_movement")
            .insert({
                supply_id: body.supply_id,
                type: body.type,
                quantity: resolveMovementQuantity(body.type, body.quantity, body.direction),
                unit_cost: unitCost,
                note: body.note,
            })
            .select("*")
            .single()

        if (error) throw new Error(error.message)

        return data as StockMovement
    },
)
