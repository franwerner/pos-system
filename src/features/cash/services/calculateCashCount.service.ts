import { type CashMovementType } from "../types/cash-movement.type"

export type CashCountSale = {
    payment_method_id: number
    total: number
}

export type CashCountMovement = {
    type: CashMovementType
    amount: number
}

export type CashCountPaymentMethod = {
    id: number
    name: string
}

export type CashCountPaymentMethodTotal = {
    payment_method_id: number
    name: string
    total: number
    is_cash: boolean
}

export type CashCountInput = {
    openingAmount: number
    sales: CashCountSale[]
    movements: CashCountMovement[]
    paymentMethods: CashCountPaymentMethod[]
    cashPaymentMethodIds: number[]
    countedAmount?: number | null
}

export type CashCount = {
    openingAmount: number
    cashSalesTotal: number
    otherSalesTotal: number
    salesTotal: number
    depositsTotal: number
    withdrawalsTotal: number
    expectedAmount: number
    totalsByPaymentMethod: CashCountPaymentMethodTotal[]
    countedAmount: number | null
    difference: number | null
    /** true = ningún método de pago califica como efectivo: nada suma al esperado en caja. */
    noCashMethod: boolean
}

const round = (value: number): number => Math.round(value * 100) / 100

const sumMovements = (movements: CashCountMovement[], type: CashMovementType): number =>
    round(movements
        .filter((movement) => movement.type === type)
        .reduce((total, movement) => total + movement.amount, 0))

export const calculateCashCount = ({
    openingAmount,
    sales,
    movements,
    paymentMethods,
    cashPaymentMethodIds,
    countedAmount = null,
}: CashCountInput): CashCount => {
    if (!Number.isFinite(openingAmount) || openingAmount < 0) {
        throw new Error("El monto inicial debe ser un número mayor o igual a 0")
    }

    if (countedAmount != null && (!Number.isFinite(countedAmount) || countedAmount < 0)) {
        throw new Error("El monto contado debe ser un número mayor o igual a 0")
    }

    const cashIds = new Set(cashPaymentMethodIds)
    const totals = new Map<number, number>()

    sales.forEach((sale) => {
        if (!Number.isFinite(sale.total)) {
            throw new Error("El total de la venta debe ser un número")
        }

        totals.set(sale.payment_method_id, (totals.get(sale.payment_method_id) ?? 0) + sale.total)
    })

    movements.forEach((movement) => {
        if (!Number.isFinite(movement.amount) || movement.amount <= 0) {
            throw new Error("El monto del movimiento debe ser un número mayor a 0")
        }
    })

    const totalsByPaymentMethod: CashCountPaymentMethodTotal[] = [...totals.entries()]
        .map(([paymentMethodId, total]) => ({
            payment_method_id: paymentMethodId,
            name: paymentMethods.find((method) => method.id === paymentMethodId)?.name
                ?? `Método #${paymentMethodId}`,
            total: round(total),
            is_cash: cashIds.has(paymentMethodId),
        }))
        .sort((a, b) => a.payment_method_id - b.payment_method_id)

    const cashSalesTotal = round(
        totalsByPaymentMethod
            .filter((method) => method.is_cash)
            .reduce((total, method) => total + method.total, 0),
    )

    const otherSalesTotal = round(
        totalsByPaymentMethod
            .filter((method) => !method.is_cash)
            .reduce((total, method) => total + method.total, 0),
    )

    const depositsTotal = sumMovements(movements, "deposit")
    const withdrawalsTotal = sumMovements(movements, "withdrawal")

    // Solo el efectivo entra al arqueo físico: la tarjeta se informa pero no está en el cajón.
    // Los movimientos de caja sí lo están, con su signo: el ingreso suma y el egreso resta.
    const expectedAmount = round(openingAmount + cashSalesTotal + depositsTotal - withdrawalsTotal)

    return {
        openingAmount: round(openingAmount),
        cashSalesTotal,
        otherSalesTotal,
        salesTotal: round(cashSalesTotal + otherSalesTotal),
        depositsTotal,
        withdrawalsTotal,
        expectedAmount,
        totalsByPaymentMethod,
        countedAmount: countedAmount == null ? null : round(countedAmount),
        difference: countedAmount == null ? null : round(countedAmount - expectedAmount),
        noCashMethod: cashIds.size === 0,
    }
}
