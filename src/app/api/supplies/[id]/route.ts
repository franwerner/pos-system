import { z } from "zod"
import {
    SUPPLY_ORIGINS,
    SUPPLY_TYPES,
    SUPPLY_UNITS,
    type Supply,
} from "@/features/supplies/types/supply.type"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"

export const runtime = "nodejs"

const componentSchema = z.object({
    supply_id: z.number().int().positive(),
    quantity: z.number().positive("La cantidad del componente debe ser mayor a 0"),
})

const patchSupplySchema = z.object({
    values: z.object({
        name: z.string().trim().min(1, "El nombre es obligatorio").optional(),
        type: z.enum(SUPPLY_TYPES).optional(),
        origin: z.enum(SUPPLY_ORIGINS).optional(),
        unit: z.enum(SUPPLY_UNITS).optional(),
        purchase_price: z.number().min(0, "El precio de compra debe ser mayor o igual a 0").optional(),
        yield_factor: z.number().positive("El rendimiento debe ser mayor a 0").optional(),
        min_stock: z.number().min(0, "El stock mínimo debe ser mayor o igual a 0").optional(),
        is_active: z.boolean().optional(),
    }),
    components: z.array(componentSchema).optional(),
})

type Component = z.infer<typeof componentSchema>

const replaceComponents = async (supplyId: number, components: Component[]) => {
    const supabase = getServerSupabase()

    const { error: deleteError } = await supabase
        .from("supply_component")
        .delete()
        .eq("parent_supply_id", supplyId)

    if (deleteError) throw new Error(deleteError.message)

    if (components.length === 0) return

    const { error: insertError } = await supabase
        .from("supply_component")
        .insert(components.map((line) => ({
            parent_supply_id: supplyId,
            component_supply_id: line.supply_id,
            quantity: line.quantity,
        })))

    if (insertError) throw new Error(insertError.message)
}

export const PATCH = authenticatedRoute(
    { body: patchSupplySchema },
    async ({ body, params }): Promise<Supply> => {
        const id = Number(params.id)

        if (!Number.isInteger(id)) throw new ApiError(400, "El id del insumo no es válido")

        const supabase = getServerSupabase()

        const { data: supply, error } = await supabase
            .from("supply")
            .update({ ...body.values, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select("*")
            .maybeSingle()

        if (error) throw new Error(error.message)
        if (!supply) throw new ApiError(404, "El insumo no existe")

        if (body.components) {
            const { data: previousComponents, error: previousError } = await supabase
                .from("supply_component")
                .select("component_supply_id, quantity")
                .eq("parent_supply_id", id)

            if (previousError) throw new Error(previousError.message)

            try {
                await replaceComponents(id, body.components)
            } catch (replaceError) {
                // El reemplazo son dos pasos sin transacción: si el alta falla, el
                // preparado se queda sin la composición que ya tenía.
                await replaceComponents(id, (previousComponents ?? []).map((line) => ({
                    supply_id: line.component_supply_id,
                    quantity: line.quantity,
                })))
                throw replaceError
            }
        }

        return supply as Supply
    },
)
