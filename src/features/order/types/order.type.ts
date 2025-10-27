import { Database } from "@/shared/types/database.types";
import { OrderProduct } from "./order-products.type";

type OrderDatabase = Database["public"]["Tables"]["Order"]["Row"]
export type Order = OrderDatabase & {
    products: OrderProduct[]
    payment_name: string
}