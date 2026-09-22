import { type TaxContext } from "@/features/taxes/types/tax.type"
import { SUPPLY_TYPES, type SupplyType } from "@/features/supplies/types/supply.type"
import { type CostableProduct, type CostingSupplyLine } from "../types/costing.type"
import { assertTaxContext, netSaleAmount } from "./calculateNetAmount.service"
import { calculateSuggestedPrice } from "./calculateSuggestedPrice.service"

export type WastePercentages = Record<SupplyType, number>

export type CostingParams = {
    price: number
    wastePercentages: WastePercentages
    fixedCostPerUnit: number
    /** `null` es un producto sin margen objetivo cargado: no hay precio sugerido. */
    targetMarginPercentage: number | null
    tax: TaxContext
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
    net_price: number
    sale_tax_amount: number
    supplies_cost: number
    waste_cost: number
    variable_cost: number
    fixed_cost_amount: number
    total_cost: number
    contribution_margin: number
    contribution_margin_percentage: number
    gross_profit: number
    profit_tax_amount: number
    net_margin: number
    net_margin_percentage: number
    target_margin_percentage: number | null
    suggested_price: number | null
    suggested_price_difference: number | null
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

const assertParams = ({ price, wastePercentages, fixedCostPerUnit, tax }: CostingParams) => {
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

    if (!Number.isFinite(fixedCostPerUnit) || fixedCostPerUnit < 0) {
        throw new Error("El costo fijo por unidad debe ser un número mayor o igual a 0")
    }

    assertTaxContext(tax)
}

const toPercentage = (margin: number, price: number): number =>
    price > 0 ? (margin / price) * 100 : 0

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
    const totalCost = variableCost + params.fixedCostPerUnit
    const netPrice = netSaleAmount(params.price, params.tax)
    const contributionMargin = netPrice - variableCost
    const grossProfit = netPrice - totalCost
    // Una pérdida no paga impuesto a la ganancia: no hay ganancia sobre la cual
    // aplicarlo.
    const profitTaxAmount = grossProfit > 0 ? grossProfit * (params.tax.profit_rate / 100) : 0
    const netMargin = grossProfit - profitTaxAmount
    const suggestedPrice = calculateSuggestedPrice({
        totalCost,
        targetMarginPercentage: params.targetMarginPercentage,
        tax: params.tax,
    })

    return {
        lines: costedLines,
        breakdown,
        price: params.price,
        net_price: netPrice,
        sale_tax_amount: params.price - netPrice,
        supplies_cost: suppliesCost,
        waste_cost: wasteCost,
        variable_cost: variableCost,
        fixed_cost_amount: params.fixedCostPerUnit,
        total_cost: totalCost,
        contribution_margin: contributionMargin,
        contribution_margin_percentage: toPercentage(contributionMargin, netPrice),
        gross_profit: grossProfit,
        profit_tax_amount: profitTaxAmount,
        net_margin: netMargin,
        net_margin_percentage: toPercentage(netMargin, netPrice),
        target_margin_percentage: params.targetMarginPercentage,
        suggested_price: suggestedPrice,
        suggested_price_difference: suggestedPrice === null ? null : suggestedPrice - params.price,
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
