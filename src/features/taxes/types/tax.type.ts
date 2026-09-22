import { type Tables } from "@/shared/types/database.types"

// El tipo dice en qué paso del cálculo entra el impuesto, no cómo agruparlo en
// una lista: un impuesto sobre la ganancia no se puede calcular antes de
// conocerla, y uno sobre la venta no se puede calcular después.
export const TAX_TYPES = ["purchase", "sale", "profit", "monthly_fixed", "payment"] as const

export type TaxType = (typeof TAX_TYPES)[number]

export const TAX_TYPE_LABELS: Record<TaxType, string> = {
    purchase: "Sobre la compra",
    sale: "Sobre la venta",
    profit: "Sobre la ganancia",
    monthly_fixed: "Monto fijo mensual",
    payment: "Por medio de pago",
}

export const TAX_TYPE_DESCRIPTIONS: Record<TaxType, string> = {
    purchase:
        "Ajusta el costo del insumo. Si se recupera como crédito fiscal se descuenta del precio de compra; si no, queda adentro del costo.",
    sale: "Se descuenta del precio de venta: esa plata no es del negocio.",
    profit: "Se aplica sobre lo que queda después de restar todos los costos.",
    monthly_fixed:
        "Un monto por mes, que se reparte entre las unidades vendidas como un costo fijo más.",
    payment:
        "Se descuenta de lo cobrado con ese medio de pago, ponderado por cuánto se cobra realmente con él.",
}

export const TAX_TYPE_EXAMPLES: Record<TaxType, string> = {
    purchase: "IVA compras",
    sale: "IVA ventas, Ingresos Brutos",
    profit: "Ganancias",
    monthly_fixed: "Cuota de monotributo",
    payment: "Comisión de tarjeta",
}

export type Tax = Omit<Tables<"tax">, "type"> & { type: TaxType }

export type TaxInput = {
    name: string
    type: TaxType
    rate: number
    amount: number
    is_recoverable: boolean
    payment_method_id: number | null
    is_active: boolean
}

/** Las tasas ya resueltas con las que costea cada paso del cálculo. */
export type TaxContext = {
    purchase_rate: number
    sale_rate: number
    payment_rate: number
    profit_rate: number
    monthly_fixed_amount: number
}

export const NO_TAXES: TaxContext = {
    purchase_rate: 0,
    sale_rate: 0,
    payment_rate: 0,
    profit_rate: 0,
    monthly_fixed_amount: 0,
}

export const usesRate = (type: TaxType): boolean => type !== "monthly_fixed"

export const usesAmount = (type: TaxType): boolean => type === "monthly_fixed"

export const usesPaymentMethod = (type: TaxType): boolean => type === "payment"

export const usesRecoverable = (type: TaxType): boolean => type === "purchase"
