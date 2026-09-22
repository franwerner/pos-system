import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type CompositionLineInput } from "@/features/supplies/types/composition.type"

const fetchProductComposition = async (productId: number): Promise<CompositionLineInput[]> => {
    const response = await fetch(`/api/products/${productId}/composition`)

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetProductComposition(productId: number | null) {
    return useQuery({
        queryKey: ["product-composition", productId],
        queryFn: () => fetchProductComposition(productId as number),
        enabled: productId !== null,
    })
}
