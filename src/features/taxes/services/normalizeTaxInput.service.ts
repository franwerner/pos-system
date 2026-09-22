import {
    usesAmount,
    usesPaymentMethod,
    usesRate,
    usesRecoverable,
    type TaxInput,
} from "../types/tax.type"

// La base rechaza un monto en un impuesto porcentual, un recuperable que no sea
// de compra o un impuesto por medio de pago sin medio de pago. Normalizar acá
// deja que el formulario cambie de tipo sin arrastrar el campo que ya no aplica.
export const normalizeTaxInput = (input: TaxInput): TaxInput => ({
    name: input.name.trim(),
    type: input.type,
    rate: usesRate(input.type) ? input.rate : 0,
    amount: usesAmount(input.type) ? input.amount : 0,
    is_recoverable: usesRecoverable(input.type) ? input.is_recoverable : false,
    payment_method_id: usesPaymentMethod(input.type) ? input.payment_method_id : null,
    is_active: input.is_active,
})
