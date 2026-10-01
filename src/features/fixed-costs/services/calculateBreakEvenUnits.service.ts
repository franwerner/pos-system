export const BREAK_EVEN_STATUSES = ["ok", "no_costable_products", "no_contribution"] as const

export type BreakEvenStatus = (typeof BREAK_EVEN_STATUSES)[number]

export type BreakEven = {
    status: BreakEvenStatus
    average_contribution_margin: number
    /** `null` cuando no hay con qué cubrir los fijos: ninguna cantidad alcanza. */
    units: number | null
}

export type BreakEvenParams = {
    fixedCostTotal: number
    /** Lo que deja cada producto costeable: precio neto − costo variable. */
    contributionMargins: number[]
}

const average = (values: number[]): number =>
    values.reduce((total, value) => total + value, 0) / values.length

// Los costos fijos ya no fijan precios; la pregunta que responden es cuánto hay
// que vender para cubrirlos. Con margen promedio 0 o negativo no se divide: no
// hay cantidad de ventas que alcance, y decirlo vale más que un número infinito.
export const calculateBreakEvenUnits = ({
    fixedCostTotal,
    contributionMargins,
}: BreakEvenParams): BreakEven => {
    if (!Number.isFinite(fixedCostTotal) || fixedCostTotal < 0) {
        throw new Error("El total de costos fijos debe ser un número mayor o igual a 0")
    }

    if (contributionMargins.some((margin) => !Number.isFinite(margin))) {
        throw new Error("El margen de contribución debe ser un número")
    }

    if (contributionMargins.length === 0) {
        return { status: "no_costable_products", average_contribution_margin: 0, units: null }
    }

    const averageContributionMargin = average(contributionMargins)

    if (averageContributionMargin <= 0) {
        return {
            status: "no_contribution",
            average_contribution_margin: averageContributionMargin,
            units: null,
        }
    }

    return {
        status: "ok",
        average_contribution_margin: averageContributionMargin,
        // No se vende media unidad: la que falta para llegar se vende entera.
        units: Math.ceil(fixedCostTotal / averageContributionMargin),
    }
}
