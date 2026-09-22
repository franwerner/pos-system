import { z } from "zod"
import {
    calculateProductionConsumption,
    calculateProductionUnitCost,
} from "@/features/production/services/calculateProductionCost.service"
import { type ProductionWithDetail } from "@/features/production/types/production.type"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"
import { loadProductionComponents } from "./load-production-components"

export const runtime = "nodejs"

const createProductionSchema = z.object({
    supply_id: z.number().int().positive(),
    quantity: z.number().positive("La cantidad producida debe ser mayor a 0"),
    produced_at: z.string().min(1, "La fecha de producción es obligatoria"),
    note: z.string().nullable().default(null),
})

export const GET = authenticatedRoute({}, async (): Promise<ProductionWithDetail[]> => {
    const { data, error } = await getServerSupabase()
        .from("production")
        .select("*, supply(name, unit), stock_movement(*, supply(name, unit))")
        .order("produced_at", { ascending: false })

    if (error) throw new Error(error.message)

    return (data ?? []) as ProductionWithDetail[]
})

export const POST = authenticatedRoute({ body: createProductionSchema }, async ({ body }) => {
    const supabase = getServerSupabase()

    const { data: supply, error: supplyError } = await supabase
        .from("supply")
        .select("id, origin")
        .eq("id", body.supply_id)
        .maybeSingle()

    if (supplyError) throw new Error(supplyError.message)
    if (!supply) throw new ApiError(404, "El preparado no existe")

    if (supply.origin !== "produced") {
        throw new ApiError(400, "Solo se puede producir un insumo preparado")
    }

    // La composición es la única fuente del consumo y del costo: el cliente no la
    // manda, se lee acá para que nadie produzca a un costo que no es el real.
    const components = await loadProductionComponents(body.supply_id)

    if (components.length === 0) {
        throw new ApiError(400, "El preparado no tiene componentes cargados")
    }

    const consumption = calculateProductionConsumption(components, body.quantity)
    const unitCost = calculateProductionUnitCost(components, body.quantity)

    const { data: production, error: productionError } = await supabase
        .from("production")
        .insert({
            supply_id: body.supply_id,
            quantity: body.quantity,
            produced_at: body.produced_at,
            note: body.note,
            unit_cost: unitCost,
        })
        .select("id")
        .single()

    if (productionError) throw new Error(productionError.message)

    const { error: movementsError } = await supabase
        .from("stock_movement")
        .insert([
            ...consumption.map((item) => ({
                supply_id: item.supply_id,
                type: "production_out",
                quantity: item.quantity,
                unit_cost: item.unit_cost,
                production_id: production.id,
            })),
            {
                supply_id: body.supply_id,
                type: "production_in",
                quantity: body.quantity,
                unit_cost: unitCost,
                production_id: production.id,
            },
        ])

    if (movementsError) {
        // PostgREST no abarca las inserciones en una transacción: sin este borrado
        // queda una producción que no movió stock, o movimientos sin su producción.
        await supabase.from("stock_movement").delete().eq("production_id", production.id)
        await supabase.from("production").delete().eq("id", production.id)
        throw new Error(movementsError.message)
    }

    return { id: production.id, unit_cost: unitCost }
})
