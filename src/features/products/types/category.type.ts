import { Database } from "@/shared/types/database.types"

export type CategoryWithoutSubCategories = Database["public"]["Tables"]["Category"]["Row"];
export type Category = Omit<CategoryWithoutSubCategories, "parent_id"> & {
    subCategories?: CategoryWithoutSubCategories[]
}