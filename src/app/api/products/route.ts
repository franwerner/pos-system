import { z } from "zod"
import { type AdminProduct } from "@/features/products/types/admin-product.type"
import { type Product } from "@/features/products/types/product.type"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"
import buildSearchTerm from "@/shared/utils/buildSearchTerm.util"

export const runtime = "nodejs"

const compositionLineSchema = z.object({
    supply_id: z.number().int().positive(),
    quantity: z.number().positive("La cantidad de la composición debe ser mayor a 0"),
})

const targetMarginSchema = z
    .number()
    .min(0, "El margen objetivo debe estar entre 0 y 99,99")
    .max(99.99, "El margen objetivo debe estar entre 0 y 99,99")
    .nullable()

const createProductSchema = z.object({
    name: z.string().trim().min(1, "El nombre es obligatorio"),
    description: z.string().nullable().default(null),
    price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
    target_margin_percentage: targetMarginSchema.default(null),
    category_id: z.number().int().positive().nullable().default(null),
    img_url: z.string().nullable().default(null),
    lines: z.array(compositionLineSchema).default([]),
})

const fetchAdminProducts = async (
    search: string | null,
    onlyActive: boolean,
): Promise<AdminProduct[]> => {
    const query = getServerSupabase()
        .from("product")
        .select("*, category(id, name), product_supply(count)")
        .order("name")

    if (onlyActive) query.eq("is_active", true)
    if (search) query.ilike("search_name", `%${buildSearchTerm(search)}%`)

    const { data, error } = await query

    if (error) throw new Error(error.message)

    return (data ?? []).map(({ product_supply, ...product }) => ({
        ...product,
        composition_count: product_supply[0]?.count ?? 0,
    }))
}

const fetchPosProducts = async (
    search: string | null,
    categoryId: number | null,
): Promise<Product[]> => {
    const supabase = getServerSupabase()

    // El inner join solo es correcto mientras se filtra: sin categoría elegida,
    // los productos sin categoría también tienen que listarse.
    const query = categoryId
        ? supabase
            .from("product")
            .select("*, category!inner(*)")
            .or(`id.eq.${categoryId},parent_id.eq.${categoryId}`, { referencedTable: "category" })
        : supabase
            .from("product")
            .select("*, category(*)")

    query.eq("is_active", true).order("name")

    if (search) query.ilike("search_name", `%${buildSearchTerm(search)}%`)

    const { data, error } = await query

    if (error) throw new Error(error.message)

    return data
}

export const GET = authenticatedRoute({}, async ({ request }) => {
    const params = request.nextUrl.searchParams
    const search = params.get("search")?.trim() || null
    const categoryId = params.get("categoryId") ? Number(params.get("categoryId")) : null

    return params.get("view") === "admin"
        ? fetchAdminProducts(search, params.get("onlyActive") === "true")
        : fetchPosProducts(search, Number.isFinite(categoryId) ? categoryId : null)
})

export const POST = authenticatedRoute({ body: createProductSchema }, async ({ body }) => {
    const supabase = getServerSupabase()

    const { data: product, error: productError } = await supabase
        .from("product")
        .insert({
            name: body.name,
            description: body.description,
            price: body.price,
            target_margin_percentage: body.target_margin_percentage,
            category_id: body.category_id,
            img_url: body.img_url,
        })
        .select("id")
        .single()

    if (productError) throw new Error(productError.message)

    if (body.lines.length > 0) {
        const { error: linesError } = await supabase
            .from("product_supply")
            .insert(body.lines.map((line) => ({
                product_id: product.id,
                supply_id: line.supply_id,
                quantity: line.quantity,
            })))

        // PostgREST no abarca las dos inserciones en una transacción: sin este
        // borrado queda un producto que el usuario nunca confirmó sin composición.
        if (linesError) {
            await supabase.from("product").delete().eq("id", product.id)
            throw new ApiError(400, "No se pudo guardar la composición del producto")
        }
    }

    return { id: product.id }
})
