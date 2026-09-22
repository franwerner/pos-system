export default function formatPercentage(
    value: number,
    locale: string = "es-AR",
): string {
    return new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(value / 100)
}
