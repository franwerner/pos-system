import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type CompositionLineInput } from "../types/composition.type"
import { type Supply, type SupplyInput } from "../types/supply.type"

export type PostSupplyInput = SupplyInput & {
    components?: CompositionLineInput[]
}

const createSupply = async (input: PostSupplyInput): Promise<Supply> => {
    const response = await fetch("/api/supplies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function usePostSupply() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createSupply,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supplies"] })
            queryClient.invalidateQueries({ queryKey: ["supply-stock"] })
            queryClient.invalidateQueries({ queryKey: ["costing"] })
        },
    })
}
