import { type Tables } from "@/shared/types/database.types"
import { type Category } from "./category.type"

export type Product = Omit<Tables<"product">, "category_id"> & {
    category: Category | null
}
