const MONTH_PATTERN = /^\d{4}-\d{2}$/

// `period` guarda el primer día del mes: el mes es la unidad del costo fijo, y
// una fecha cerrada evita que dos cargas del mismo mes caigan en días distintos.
export const toPeriodDate = (month: string): string => {
    if (!MONTH_PATTERN.test(month)) {
        throw new Error("El mes debe tener el formato AAAA-MM")
    }

    return `${month}-01`
}

export const toMonthValue = (period: string): string => period.slice(0, 7)

export const currentMonth = (): string => {
    const now = new Date()

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export const formatPeriod = (period: string, locale: string = "es-AR"): string =>
    new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" })
        .format(new Date(`${toMonthValue(period)}-01T12:00:00`))
