import { readApiError } from "@/features/auth/services/readApiError.service"
import { type ProductCompositionLine } from "@/features/stock/services/calculateSaleConsumption.service"

export const fetchProductCompositionLines = async (
    productIds: number[],
): Promise<ProductCompositionLine[]> => {
    if (productIds.length === 0) return []

    const response = await fetch(`/api/products/composition?productIds=${productIds.join(",")}`)

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}
