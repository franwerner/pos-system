export type CashPaymentMethod = {
    id: number
    name: string
}

const CASH_NAME_PATTERN = /efectivo|cash/

const normalizeName = (name: string): string =>
    name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase()

// El schema no marca qué método de pago es efectivo, así que se resuelve por nombre;
// si ningún método se llama así, el de la config es el que entra al arqueo físico.
export const resolveCashPaymentMethodIds = (
    paymentMethods: CashPaymentMethod[],
    defaultPaymentMethodId?: number | null,
): number[] => {
    const byName = paymentMethods
        .filter((method) => CASH_NAME_PATTERN.test(normalizeName(method.name)))
        .map((method) => method.id)

    if (byName.length > 0) return byName

    if (defaultPaymentMethodId == null) return []

    return paymentMethods.some((method) => method.id === defaultPaymentMethodId)
        ? [defaultPaymentMethodId]
        : []
}
