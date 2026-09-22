import { type Category } from "@/features/products/types/category.type"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"

export const runtime = "nodejs"

export const GET = authenticatedRoute({}, async (): Promise<Category[]> => {
    const { data, error } = await getServerSupabase()
        .from("category")
        .select("*")
        .order("name")

    if (error) throw new Error(error.message)

    return data
        .filter((category) => category.parent_id === null)
        .map(({ parent_id, ...category }) => ({
            ...category,
            subCategories: data.filter((sub) => sub.parent_id === category.id),
        }))
})
