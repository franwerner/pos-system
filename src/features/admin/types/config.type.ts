import { type Payment } from "@/features/payment/types/payment.type";
import { type Tables } from "@/shared/types/database.types";

export type ConfigPos = Omit<Tables<"app_config">, "default_payment_id"> & {
    default_payment: Payment
}
