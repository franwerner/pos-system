const MONTH_PATTERN = /^\d{4}-\d{2}$/

export type MonthRange = {
    from: string
    to: string
}

export const resolveMonthRange = (month: string): MonthRange => {
    if (!MONTH_PATTERN.test(month)) {
        throw new Error("El mes debe tener el formato AAAA-MM")
    }

    const [year, monthNumber] = month.split("-").map(Number)

    return {
        from: new Date(Date.UTC(year, monthNumber - 1, 1)).toISOString(),
        to: new Date(Date.UTC(year, monthNumber, 1)).toISOString(),
    }
}
