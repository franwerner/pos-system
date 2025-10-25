export default function formatCurrency(
    amount: number,
    locale: string = "es-AR",
    currency: string = "ARS"
): string {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}