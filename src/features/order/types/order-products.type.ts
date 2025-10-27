import { Product } from "@/features/products/types/product.type";
import { Database } from "@/shared/types/database.types";

type OrderProductDatabase = Database["public"]["Tables"]["Order_Product"]["Row"]
export type OrderProduct = OrderProductDatabase & Pick<Product, "name" | "img_url" | "description" | "unit_type">