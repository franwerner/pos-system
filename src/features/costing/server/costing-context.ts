import { toPeriodDate } from "@/features/fixed-costs/services/resolvePeriod.service"
import { listTaxes } from "@/features/taxes/server/tax.repository"
import { buildTaxContext } from "@/features/taxes/services/buildTaxContext.service"
import { type CollectedPayment } from "@/features/taxes/services/calculatePaymentTaxRate.service"
import { ApiError } from "@/server/api/api-error"
import { getServerSupabase } from "@/server/supabase"
import {
    calculateMeasuredFixedCost,
    type ClosedMonthSource,
} from "../services/calculateMeasuredFixedCost.service"
import { resolveCostingConfig } from "../services/resolveCostingConfig.service"
import { resolveMonthRange } from "../services/resolveMonthRange.service"
import { type CostingContext } from "../types/costing.type"

const COSTING_CONFIG_COLUMNS =
    "waste_percentage_food, waste_percentage_drink, waste_percentage_packaging"

const toMonth = (value: string): string => value.slice(0, 7)

const readCostingConfig = async () => {
    const { data, error } = await getServerSupabase()
        .from("app_config")
        .select(COSTING_CONFIG_COLUMNS)
        .limit(1)
        .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) throw new ApiError(404, "No hay configuración cargada")

    return data
}

/** Lo cobrado con cada medio de pago en el mes, para ponderar los impuestos `payment`. */
const fetchCollectedPayments = async (month: string): Promise<CollectedPayment[]> => {
    const { from, to } = resolveMonthRange(month)

    const { data, error } = await getServerSupabase()
        .from("sale_payment")
        .select("payment_method_id, amount, sale!inner(created_at)")
        .gte("sale.created_at", from)
        .lt("sale.created_at", to)

    if (error) throw new Error(error.message)

    return (data ?? []).map((payment) => ({
        payment_method_id: payment.payment_method_id,
        amount: payment.amount,
    }))
}

const fetchSoldUnitsByMonth = async (before: string): Promise<Map<string, number>> => {
    const { data, error } = await getServerSupabase()
        .from("sale_item")
        .select("quantity, sale!inner(created_at)")
        .lt("sale.created_at", before)

    if (error) throw new Error(error.message)

    return (data ?? []).reduce((units, item) => {
        const month = toMonth(item.sale.created_at)

        return units.set(month, (units.get(month) ?? 0) + item.quantity)
    }, new Map<string, number>())
}

const fetchFixedCostsByMonth = async (before: string): Promise<Map<string, number>> => {
    const { data, error } = await getServerSupabase()
        .from("fixed_cost")
        .select("amount, period")
        .lt("period", before)

    if (error) throw new Error(error.message)

    return (data ?? []).reduce((totals, cost) => {
        const month = toMonth(cost.period)

        return totals.set(month, (totals.get(month) ?? 0) + cost.amount)
    }, new Map<string, number>())
}

// Un monto fijo mensual es un costo fijo más: se paga todos los meses, así que
// pesa sobre cada mes cerrado igual que el alquiler.
const buildClosedMonths = (
    soldUnits: Map<string, number>,
    fixedCosts: Map<string, number>,
    monthlyFixedTaxAmount: number,
): ClosedMonthSource[] =>
    [...soldUnits.keys()].map((month) => ({
        month,
        fixedCostTotal: (fixedCosts.get(month) ?? 0) + monthlyFixedTaxAmount,
        soldUnits: soldUnits.get(month) ?? 0,
    }))

// El mes en curso nunca entra al reparto de los fijos: está incompleto y daría un
// costo por unidad enorme a principio de mes.
export const loadCostingContext = async (month: string): Promise<CostingContext> => {
    const monthStart = toPeriodDate(month)

    const [config, activeTaxes, collectedPayments, soldUnits, fixedCosts] = await Promise.all([
        readCostingConfig(),
        listTaxes(true),
        fetchCollectedPayments(month),
        fetchSoldUnitsByMonth(monthStart),
        fetchFixedCostsByMonth(monthStart),
    ])

    const tax = buildTaxContext(activeTaxes, collectedPayments)
    const { wastePercentages } = resolveCostingConfig(config)

    return {
        tax,
        active_taxes: activeTaxes,
        waste_percentages: wastePercentages,
        fixed_cost_per_unit: calculateMeasuredFixedCost(
            buildClosedMonths(soldUnits, fixedCosts, tax.monthly_fixed_amount),
        ),
    }
}
