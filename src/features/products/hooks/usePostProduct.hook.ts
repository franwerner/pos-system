import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type ProductInput } from "../types/admin-product.type"

const createProduct = async (input: ProductInput): Promise<number> => {
    const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    const { id } = await response.json()

    return id
}

export default function usePostProduct() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-products"] })
            queryClient.invalidateQueries({ queryKey: ["products"] })
            queryClient.invalidateQueries({ queryKey: ["costing"] })
        },
    })
}
