import useGetConfig from "@/features/admin/hooks/useGetConfig.hook"
import { useGetPayments } from "@/features/payment/hooks/useGetPayments.hook"
import { resolveCashPaymentMethodIds } from "../services/resolveCashPaymentMethods.service"

export default function useGetCashPaymentMethods() {
    const { data: paymentMethods } = useGetPayments()
    const { data: config } = useGetConfig()

    const methods = paymentMethods ?? []

    return {
        paymentMethods: methods,
        cashPaymentMethodIds: resolveCashPaymentMethodIds(methods, config?.default_payment.id),
    }
}
