import { type Tables } from "@/shared/types/database.types"

type SaleItemProduct = Pick<Tables<"product">, "name" | "img_url" | "description">

export type SaleItem = Tables<"sale_item"> & {
    product: SaleItemProduct
}
