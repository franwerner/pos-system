export type PaymentTaxSource = {
    payment_method_id: number
    rate: number
}

export type CollectedPayment = {
    payment_method_id: number
    amount: number
}

const assertRate = (rate: number) => {
    if (!Number.isFinite(rate) || rate < 0) {
        throw new Error("La tasa del impuesto debe ser un número mayor o igual a 0")
    }
}

const assertAmount = (amount: number) => {
    if (!Number.isFinite(amount) || amount < 0) {
        throw new Error("Lo cobrado con un medio de pago debe ser un número mayor o igual a 0")
    }
}

const collectedByMethod = (payments: CollectedPayment[]): Map<number, number> =>
    payments.reduce((totals, payment) => {
        assertAmount(payment.amount)

        return totals.set(
            payment.payment_method_id,
            (totals.get(payment.payment_method_id) ?? 0) + payment.amount,
        )
    }, new Map<number, number>())

const simpleAverage = (taxes: PaymentTaxSource[]): number =>
    taxes.reduce((total, tax) => total + tax.rate, 0) / taxes.length

// Un impuesto por medio de pago no pesa lo mismo si el 90% se cobra en efectivo:
// se pondera por cómo te pagan realmente. Sin ventas con qué ponderar, el
// promedio simple de los activos es la única estimación que no inventa una
// preferencia que el negocio todavía no tiene.
export const calculatePaymentTaxRate = (
    taxes: PaymentTaxSource[],
    payments: CollectedPayment[],
): number => {
    taxes.forEach((tax) => assertRate(tax.rate))

    if (taxes.length === 0) return 0

    const collected = collectedByMethod(payments)
    const total = [...collected.values()].reduce((sum, amount) => sum + amount, 0)

    if (total <= 0) return simpleAverage(taxes)

    return taxes.reduce(
        (rate, tax) => rate + tax.rate * ((collected.get(tax.payment_method_id) ?? 0) / total),
        0,
    )
}
