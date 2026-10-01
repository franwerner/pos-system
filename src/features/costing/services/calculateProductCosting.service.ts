import { SUPPLY_TYPES, type SupplyType } from "@/features/supplies/types/supply.type"
import { type CostableProduct, type CostingSupplyLine } from "../types/costing.type"
import { calculateSuggestedPrice } from "./calculateSuggestedPrice.service"

export type WastePercentages = Record<SupplyType, number>

export type CostingParams = {
    price: number
    wastePercentages: WastePercentages
    /** `null` es un producto sin margen objetivo cargado: no hay precio sugerido. */
    targetMarginPercentage: number | null
}

export type CostedSupplyLine = CostingSupplyLine & {
    line_cost: number
    waste_cost: number
    total_cost: number
}

export type CostingBreakdown = Record<SupplyType, number>

export type ProductCosting = {
    lines: CostedSupplyLine[]
    breakdown: CostingBreakdown
    price: number
    supplies_cost: number
    waste_cost: number
    /** "Cuesta hacerlo": lo único que sale de la receta, sin impuestos ni costo fijo. */
    variable_cost: number
    /** "Te queda por plato": precio de venta menos lo que cuesta hacerlo. */
    contribution_margin: number
    target_margin_percentage: number | null
    /** "Precio sugerido": costo variable llevado al margen objetivo, sin impuestos. */
    suggested_price: number | null
}

export type ProductCostingRow = CostableProduct & {
    costing: ProductCosting | null
}

const emptyBreakdown = (): CostingBreakdown =>
    SUPPLY_TYPES.reduce(
        (breakdown, type) => ({ ...breakdown, [type]: 0 }),
        {} as CostingBreakdown,
    )

const assertLine = ({ quantity, unit_cost }: CostingSupplyLine) => {
    if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("La cantidad de la composición debe ser un número mayor a 0")
    }

    if (!Number.isFinite(unit_cost) || unit_cost < 0) {
        throw new Error("El costo del insumo debe ser un número mayor o igual a 0")
    }
}

const assertParams = ({ price, wastePercentages }: CostingParams) => {
    if (!Number.isFinite(price) || price < 0) {
        throw new Error("El precio debe ser un número mayor o igual a 0")
    }

    const invalidWaste = SUPPLY_TYPES.some((type) => {
        const percentage = wastePercentages[type]

        return !Number.isFinite(percentage) || percentage < 0 || percentage > 100
    })

    if (invalidWaste) {
        throw new Error("La merma debe estar entre 0 y 100")
    }
}

// Un producto sin composición no tiene de dónde sacar un costo: devuelve null en
// vez de 0 para que la pantalla lo muestre como "sin costear" y no como gratis.
export const calculateProductCosting = (
    lines: CostingSupplyLine[],
    params: CostingParams,
): ProductCosting | null => {
    if (lines.length === 0) return null

    assertParams(params)

    // Se rompe la carne, no la bandeja: cada línea carga la merma de su propio
    // tipo de insumo.
    const costedLines = lines.map((line) => {
        assertLine(line)

        const lineCost = line.quantity * line.unit_cost
        const wasteCost = lineCost * (params.wastePercentages[line.type] / 100)

        return { ...line, line_cost: lineCost, waste_cost: wasteCost, total_cost: lineCost + wasteCost }
    })

    const breakdown = costedLines.reduce(
        (totals, line) => ({ ...totals, [line.type]: totals[line.type] + line.total_cost }),
        emptyBreakdown(),
    )

    const suppliesCost = costedLines.reduce((total, line) => total + line.line_cost, 0)
    const wasteCost = costedLines.reduce((total, line) => total + line.waste_cost, 0)
    const variableCost = suppliesCost + wasteCost
    // Ni impuestos ni comisiones se restan acá: el margen objetivo que se usa para el
    // precio sugerido ya tiene que cubrirlos (ver PLAN/02-impuestos.md).
    const contributionMargin = params.price - variableCost
    const suggestedPrice = calculateSuggestedPrice({
        variableCost,
        targetMarginPercentage: params.targetMarginPercentage,
    })

    return {
        lines: costedLines,
        breakdown,
        price: params.price,
        supplies_cost: suppliesCost,
        waste_cost: wasteCost,
        variable_cost: variableCost,
        contribution_margin: contributionMargin,
        target_margin_percentage: params.targetMarginPercentage,
        suggested_price: suggestedPrice,
    }
}

export const buildProductCostings = (
    products: CostableProduct[],
    params: Omit<CostingParams, "price" | "targetMarginPercentage">,
): ProductCostingRow[] =>
    products.map((product) => ({
        ...product,
        costing: calculateProductCosting(product.lines, {
            ...params,
            price: product.price,
            targetMarginPercentage: product.target_margin_percentage,
        }),
    }))
