import { type Tables } from "@/shared/types/database.types"

export type CategoryWithoutSubCategories = Tables<"category">
export type Category = Omit<CategoryWithoutSubCategories, "parent_id"> & {
    subCategories?: CategoryWithoutSubCategories[]
}
