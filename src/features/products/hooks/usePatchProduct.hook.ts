import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type CompositionLineInput } from "@/features/supplies/types/composition.type"
import { type ProductInput } from "../types/admin-product.type"

export type PatchProductInput = {
    id: number
    values: Partial<Omit<ProductInput, "lines">> & { is_active?: boolean }
    lines?: CompositionLineInput[]
}

const patchProduct = async ({ id, values, lines }: PatchProductInput): Promise<number> => {
    const response = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values, lines }),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    return id
}

export default function usePatchProduct() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: patchProduct,
        onSuccess: (productId) => {
            queryClient.invalidateQueries({ queryKey: ["admin-products"] })
            queryClient.invalidateQueries({ queryKey: ["products"] })
            queryClient.invalidateQueries({ queryKey: ["product-composition", productId] })
            queryClient.invalidateQueries({ queryKey: ["costing"] })
        },
    })
}
