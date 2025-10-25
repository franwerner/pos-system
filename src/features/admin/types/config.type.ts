import { Payment } from "@/features/payment/types/payment.type";
import { Database } from "@/shared/types/database.types";

export type ConfigPos = Omit<Database["public"]["Tables"]["Config"]["Row"], "default_payment_id"> & {
    default_payment: Payment
}