import { NO_TAXES, type TaxContext, type TaxType } from "../types/tax.type"
import {
    calculatePaymentTaxRate,
    type CollectedPayment,
} from "./calculatePaymentTaxRate.service"

export type TaxSource = {
    type: TaxType
    rate: number
    amount: number
    is_recoverable: boolean
    payment_method_id: number | null
    is_active: boolean
}

const assertSource = ({ rate, amount }: TaxSource) => {
    if (!Number.isFinite(rate) || rate < 0) {
        throw new Error("La tasa del impuesto debe ser un número mayor o igual a 0")
    }

    if (!Number.isFinite(amount) || amount < 0) {
        throw new Error("El monto del impuesto debe ser un número mayor o igual a 0")
    }
}

const sumRates = (taxes: TaxSource[], type: TaxType): number =>
    taxes.filter((tax) => tax.type === type).reduce((total, tax) => total + tax.rate, 0)

// Un impuesto de compra que no se recupera ya está adentro del precio pagado: es
// costo y no se toca. Solo el recuperable se descuenta.
const sumRecoverablePurchaseRates = (taxes: TaxSource[]): number =>
    taxes
        .filter((tax) => tax.type === "purchase" && tax.is_recoverable)
        .reduce((total, tax) => total + tax.rate, 0)

const toPaymentTaxes = (taxes: TaxSource[]) =>
    taxes
        .filter((tax) => tax.type === "payment" && tax.payment_method_id !== null)
        .map((tax) => ({ payment_method_id: tax.payment_method_id as number, rate: tax.rate }))

// Con la tabla vacía el contexto queda en cero y el costeo da exactamente lo que
// daba antes de que los impuestos fueran configurables.
export const buildTaxContext = (
    taxes: TaxSource[],
    payments: CollectedPayment[] = [],
): TaxContext => {
    const active = taxes.filter((tax) => tax.is_active)

    active.forEach(assertSource)

    if (active.length === 0) return NO_TAXES

    return {
        purchase_rate: sumRecoverablePurchaseRates(active),
        sale_rate: sumRates(active, "sale"),
        payment_rate: calculatePaymentTaxRate(toPaymentTaxes(active), payments),
        profit_rate: sumRates(active, "profit"),
        monthly_fixed_amount: active
            .filter((tax) => tax.type === "monthly_fixed")
            .reduce((total, tax) => total + tax.amount, 0),
    }
}
