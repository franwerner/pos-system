import { ConfigPos } from "../types/config.type";
import paymentsData from "../../payment/data/payments.data";

const configData: ConfigPos = {
    default_payment: paymentsData[0],
    id: 1,
    updated_at: new Date().toISOString(),
}

export default configData