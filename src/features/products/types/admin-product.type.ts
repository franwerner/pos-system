import { type CompositionLineInput } from "@/features/supplies/types/composition.type"
import { type Tables } from "@/shared/types/database.types"

export type AdminProduct = Tables<"product"> & {
    category: Pick<Tables<"category">, "id" | "name"> | null
    composition_count: number
}

export type ProductInput = {
    name: string
    description: string | null
    price: number
    /** `null` sigue al margen objetivo de la configuración. */
    target_margin_percentage: number | null
    category_id: number | null
    img_url: string | null
    lines: CompositionLineInput[]
}

export type AdminProductFilter = {
    search: string
    onlyActive: boolean
}
