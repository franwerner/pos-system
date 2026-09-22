import { z } from "zod"
import { calculatePurchaseTotal } from "@/features/purchases/services/calculatePurchaseTotal.service"
import { type PurchaseWithItems } from "@/features/purchases/types/purchase.type"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"

export const runtime = "nodejs"

const purchaseLineSchema = z.object({
    supply_id: z.number().int().positive(),
    quantity: z.number().positive("La cantidad de la línea debe ser mayor a 0"),
    unit_price: z.number().min(0, "El precio unitario debe ser mayor o igual a 0"),
})

const createPurchaseSchema = z.object({
    supplier_name: z.string().nullable().default(null),
    purchased_at: z.string().min(1, "La fecha de compra es obligatoria"),
    note: z.string().nullable().default(null),
    lines: z.array(purchaseLineSchema).min(1, "La compra necesita al menos una línea"),
})

export const GET = authenticatedRoute({}, async (): Promise<PurchaseWithItems[]> => {
    const { data, error } = await getServerSupabase()
        .from("purchase")
        .select("*, purchase_item(*, supply(name, unit))")
        .order("purchased_at", { ascending: false })

    if (error) throw new Error(error.message)

    return (data ?? []) as PurchaseWithItems[]
})

export const POST = authenticatedRoute({ body: createPurchaseSchema }, async ({ body }) => {
    const supabase = getServerSupabase()
    const total = calculatePurchaseTotal(body.lines)

    const supplyIds = [...new Set(body.lines.map((line) => line.supply_id))]

    const { data: supplies, error: suppliesError } = await supabase
        .from("supply")
        .select("id")
        .in("id", supplyIds)

    if (suppliesError) throw new Error(suppliesError.message)

    if ((supplies ?? []).length !== supplyIds.length) {
        throw new ApiError(400, "Alguno de los insumos de la compra no existe")
    }

    const { data: purchase, error: purchaseError } = await supabase
        .from("purchase")
        .insert({
            supplier_name: body.supplier_name,
            purchased_at: body.purchased_at,
            note: body.note,
            total,
        })
        .select("id")
        .single()

    if (purchaseError) throw new Error(purchaseError.message)

    // PostgREST no abarca las inserciones en una transacción. Los ítems caen con la
    // compra por cascada, pero los movimientos solo quedan con `purchase_id` en null:
    // hay que borrarlos a mano o el stock queda inflado por una compra que no existe.
    const rollback = async () => {
        await supabase.from("stock_movement").delete().eq("purchase_id", purchase.id)
        await supabase.from("purchase").delete().eq("id", purchase.id)
    }

    const { error: itemsError } = await supabase
        .from("purchase_item")
        .insert(body.lines.map((line) => ({
            purchase_id: purchase.id,
            supply_id: line.supply_id,
            quantity: line.quantity,
            unit_price: line.unit_price,
        })))

    if (itemsError) {
        await rollback()
        throw new Error(itemsError.message)
    }

    const { error: movementsError } = await supabase
        .from("stock_movement")
        .insert(body.lines.map((line) => ({
            supply_id: line.supply_id,
            type: "purchase",
            quantity: line.quantity,
            unit_cost: line.unit_price,
            purchase_id: purchase.id,
        })))

    if (movementsError) {
        await rollback()
        throw new Error(movementsError.message)
    }

    const priceResults = await Promise.all(body.lines.map((line) =>
        supabase
            .from("supply")
            .update({ purchase_price: line.unit_price, updated_at: new Date().toISOString() })
            .eq("id", line.supply_id),
    ))

    const priceError = priceResults.find((result) => result.error)?.error

    if (priceError) {
        await rollback()
        throw new Error(priceError.message)
    }

    return { id: purchase.id, total }
})
