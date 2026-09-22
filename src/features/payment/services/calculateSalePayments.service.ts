import formatCurrency from "@/shared/utils/formatCurrency.util"
import { calculateTax } from "./calculateTax.service"

export type SalePaymentInput = {
    payment_method_id: number
    amount: number
}

export type SalePaymentMethod = {
    id: number
    tax: number
}

export type SalePaymentLine = {
    payment_method_id: number
    amount: number
    surcharge_amount: number
}

export type SalePaymentsBreakdown = {
    lines: SalePaymentLine[]
    paymentsTotal: number
    surchargeTotal: number
    total: number
    remaining: number
}

const round = (value: number): number => Math.round(value * 100) / 100

// El ajuste es por pago: cada parte lleva el porcentaje de su propio método, no el
// del método "principal" de la venta. Con signo: recarga si es positivo, descuenta si
// es negativo, así que el total puede quedar por debajo del subtotal.
export const calculateSalePayments = (
    payments: SalePaymentInput[],
    paymentMethods: SalePaymentMethod[],
    subTotal: number,
): SalePaymentsBreakdown => {
    if (!Number.isFinite(subTotal) || subTotal <= 0) {
        throw new Error("El total de la venta debe ser un número mayor a 0")
    }

    const lines = payments.map((payment) => {
        const method = paymentMethods.find((item) => item.id === payment.payment_method_id)

        if (!method) {
            throw new Error(`El método de pago #${payment.payment_method_id} no existe o no está activo`)
        }

        if (!Number.isFinite(payment.amount) || payment.amount <= 0) {
            throw new Error("El monto de cada pago debe ser un número mayor a 0")
        }

        return {
            payment_method_id: payment.payment_method_id,
            amount: round(payment.amount),
            surcharge_amount: round(calculateTax(payment.amount, method.tax).tax),
        }
    })

    const paymentsTotal = round(lines.reduce((total, line) => total + line.amount, 0))
    const surchargeTotal = round(lines.reduce((total, line) => total + line.surcharge_amount, 0))

    return {
        lines,
        paymentsTotal,
        surchargeTotal,
        total: round(paymentsTotal + surchargeTotal),
        remaining: round(round(subTotal) - paymentsTotal),
    }
}

/** El mensaje que ve el usuario cuando lo repartido no da el total; `null` si cierra. */
export const findPaymentsCoverageError = (breakdown: SalePaymentsBreakdown): string | null => {
    if (breakdown.lines.length === 0) return "Registrá al menos un pago"

    if (breakdown.remaining > 0) {
        return `Los pagos no cubren el total: faltan asignar ${formatCurrency(breakdown.remaining)}`
    }

    if (breakdown.remaining < 0) {
        return `Los pagos superan el total: sobran ${formatCurrency(Math.abs(breakdown.remaining))}`
    }

    return null
}
