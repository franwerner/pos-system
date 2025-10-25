import { Database } from "@/shared/types/database.types"
import { Category } from "./category.type"

export type Product = Omit<Database["public"]["Tables"]["Product"]["Row"], "category_id"> & {
    category: Category
}
