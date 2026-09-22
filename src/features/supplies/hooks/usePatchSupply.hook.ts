import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type CompositionLineInput } from "../types/composition.type"
import { type Supply, type SupplyInput } from "../types/supply.type"

export type PatchSupplyInput = {
    id: number
    values: Partial<SupplyInput> & { is_active?: boolean }
    components?: CompositionLineInput[]
}

const patchSupply = async ({ id, values, components }: PatchSupplyInput): Promise<Supply> => {
    const response = await fetch(`/api/supplies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values, components }),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function usePatchSupply() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: patchSupply,
        onSuccess: (supply) => {
            queryClient.invalidateQueries({ queryKey: ["supplies"] })
            queryClient.invalidateQueries({ queryKey: ["supply-stock"] })
            queryClient.invalidateQueries({ queryKey: ["supply-composition", supply.id] })
            queryClient.invalidateQueries({ queryKey: ["costing"] })
        },
    })
}
