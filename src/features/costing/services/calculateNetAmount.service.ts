import { type TaxContext } from "@/features/taxes/types/tax.type"

export const assertTaxContext = (tax: TaxContext) => {
    const rates = [tax.purchase_rate, tax.sale_rate, tax.payment_rate, tax.profit_rate]

    if (rates.some((rate) => !Number.isFinite(rate) || rate < 0)) {
        throw new Error("Las tasas de impuestos deben ser un número mayor o igual a 0")
    }

    if (!Number.isFinite(tax.monthly_fixed_amount) || tax.monthly_fixed_amount < 0) {
        throw new Error("El monto fijo mensual debe ser un número mayor o igual a 0")
    }
}

const assertAmount = (amount: number) => {
    if (!Number.isFinite(amount) || amount < 0) {
        throw new Error("El importe debe ser un número mayor o igual a 0")
    }
}

const assertRate = (rate: number) => {
    if (!Number.isFinite(rate) || rate < 0) {
        throw new Error("La tasa del impuesto debe ser un número mayor o igual a 0")
    }
}

export const calculateNetAmount = (grossAmount: number, rate: number): number => {
    assertAmount(grossAmount)
    assertRate(rate)

    return grossAmount / (1 + rate / 100)
}

export const calculateGrossAmount = (netAmount: number, rate: number): number => {
    assertAmount(netAmount)
    assertRate(rate)

    return netAmount * (1 + rate / 100)
}

// Un impuesto de compra recuperable vuelve como crédito fiscal: nunca fue costo.
export const netPurchaseAmount = (grossAmount: number, tax: TaxContext): number =>
    calculateNetAmount(grossAmount, tax.purchase_rate)

// Lo que se va del precio antes de que el negocio vea un peso: el impuesto sobre
// la venta y la comisión del medio de pago con el que le pagan.
export const saleDeductionRate = (tax: TaxContext): number => tax.sale_rate + tax.payment_rate

export const netSaleAmount = (grossAmount: number, tax: TaxContext): number =>
    calculateNetAmount(grossAmount, saleDeductionRate(tax))

export const grossSaleAmount = (netAmount: number, tax: TaxContext): number =>
    calculateGrossAmount(netAmount, saleDeductionRate(tax))
