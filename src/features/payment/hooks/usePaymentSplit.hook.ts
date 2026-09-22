import { useMemo } from "react"
import {
    calculateSalePayments,
    findPaymentsCoverageError,
    type SalePaymentMethod,
    type SalePaymentsBreakdown,
} from "../services/calculateSalePayments.service"
import { type PaymentDraft } from "../types/payment.type"

const emptyBreakdown = (subTotal: number): SalePaymentsBreakdown => ({
    lines: [],
    paymentsTotal: 0,
    surchargeTotal: 0,
    total: 0,
    remaining: subTotal,
})

/** Mientras se escribe hay partes sin monto: el reparto se calcula solo con las completas. */
export const usePaymentSplit = (
    payments: PaymentDraft[],
    paymentMethods: SalePaymentMethod[],
    subTotal: number,
) => useMemo(() => {
    if (subTotal <= 0) {
        const breakdown = emptyBreakdown(subTotal)

        return { breakdown, coverageError: null, validPayments: [] }
    }

    const validPayments = payments.filter((payment) =>
        Number.isFinite(payment.amount)
        && payment.amount > 0
        && paymentMethods.some((method) => method.id === payment.payment_method_id))

    const breakdown = calculateSalePayments(validPayments, paymentMethods, subTotal)

    return {
        breakdown,
        coverageError: findPaymentsCoverageError(breakdown),
        validPayments,
    }
}, [payments, paymentMethods, subTotal])
