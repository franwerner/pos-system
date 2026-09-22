import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { fetchProductCompositionLines } from "@/features/products/queries/product-composition.query"
import { type SupplyUnit } from "@/features/supplies/types/supply.type"
import {
    calculateSaleConsumption,
    findStockShortages,
    type SaleCartLine,
} from "../services/calculateSaleConsumption.service"
import { type SupplyStock } from "../types/stock.type"

export type CartShortage = {
    supply_id: number
    name: string
    unit: SupplyUnit
    required: number
    available: number
}

const fetchStockFor = async (supplyIds: number[]): Promise<SupplyStock[]> => {
    const response = await fetch(`/api/stock?supplyIds=${supplyIds.join(",")}`)

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

const fetchCartShortages = async (lines: SaleCartLine[]): Promise<CartShortage[]> => {
    const composition = await fetchProductCompositionLines(lines.map((line) => line.product_id))
    const consumption = calculateSaleConsumption(lines, composition)

    if (consumption.length === 0) return []

    const stock = await fetchStockFor(consumption.map((item) => item.supply_id))

    return findStockShortages(consumption, stock).map((shortage) => {
        const row = stock.find((item) => item.supply_id === shortage.supply_id)

        return {
            ...shortage,
            name: row?.name ?? `Insumo #${shortage.supply_id}`,
            unit: row?.unit ?? "u",
        }
    })
}

export default function useGetCartShortages(lines: SaleCartLine[]) {
    return useQuery({
        queryKey: ["cart-shortages", lines],
        queryFn: () => fetchCartShortages(lines),
        enabled: lines.length > 0,
    })
}
