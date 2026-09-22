import { z } from "zod"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"

export const runtime = "nodejs"

const compositionLineSchema = z.object({
    supply_id: z.number().int().positive(),
    quantity: z.number().positive("La cantidad de la composición debe ser mayor a 0"),
})

const patchProductSchema = z.object({
    values: z.object({
        name: z.string().trim().min(1, "El nombre es obligatorio").optional(),
        description: z.string().nullable().optional(),
        price: z.number().min(0, "El precio debe ser mayor o igual a 0").optional(),
        target_margin_percentage: z
            .number()
            .min(0, "El margen objetivo debe estar entre 0 y 99,99")
            .max(99.99, "El margen objetivo debe estar entre 0 y 99,99")
            .nullable()
            .optional(),
        category_id: z.number().int().positive().nullable().optional(),
        img_url: z.string().nullable().optional(),
        is_active: z.boolean().optional(),
    }),
    lines: z.array(compositionLineSchema).optional(),
})

type CompositionLine = z.infer<typeof compositionLineSchema>

const replaceComposition = async (productId: number, lines: CompositionLine[]) => {
    const supabase = getServerSupabase()

    const { error: deleteError } = await supabase
        .from("product_supply")
        .delete()
        .eq("product_id", productId)

    if (deleteError) throw new Error(deleteError.message)

    if (lines.length === 0) return

    const { error: insertError } = await supabase
        .from("product_supply")
        .insert(lines.map((line) => ({
            product_id: productId,
            supply_id: line.supply_id,
            quantity: line.quantity,
        })))

    if (insertError) throw new Error(insertError.message)
}

export const PATCH = authenticatedRoute(
    { body: patchProductSchema },
    async ({ body, params }) => {
        const id = Number(params.id)

        if (!Number.isInteger(id)) throw new ApiError(400, "El id del producto no es válido")

        const supabase = getServerSupabase()

        const { data: product, error: productError } = await supabase
            .from("product")
            .update({ ...body.values, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select("id")
            .maybeSingle()

        if (productError) throw new Error(productError.message)
        if (!product) throw new ApiError(404, "El producto no existe")

        if (body.lines) {
            const { data: previousLines, error: previousError } = await supabase
                .from("product_supply")
                .select("supply_id, quantity")
                .eq("product_id", id)

            if (previousError) throw new Error(previousError.message)

            try {
                await replaceComposition(id, body.lines)
            } catch (error) {
                // El reemplazo son dos pasos sin transacción: si el alta falla, el
                // producto se queda sin la composición que ya tenía.
                await replaceComposition(id, previousLines ?? [])
                throw error
            }
        }

        return { id }
    },
)
