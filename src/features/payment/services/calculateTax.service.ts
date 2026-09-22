/**
 * El porcentaje lleva signo: positivo recarga, negativo descuenta. El precio de lista
 * ya incluye el costo de cobrar con tarjeta, así que lo que se ofrece es descuento por
 * efectivo, no recargo por tarjeta.
 */
export const calculateTax = (n: number, tax: number) => {
    return {
        tax: n * (tax / 100),
        total: n + (n * (tax / 100))
    }
}
