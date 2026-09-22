import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type FixedCost, type FixedCostInput } from "../types/fixed-cost.type"

export type PatchFixedCostInput = {
    id: number
    values: Partial<FixedCostInput>
}

const patchFixedCost = async ({ id, values }: PatchFixedCostInput): Promise<FixedCost> => {
    const response = await fetch(`/api/fixed-costs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function usePatchFixedCost() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: patchFixedCost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fixed-costs"] })
            queryClient.invalidateQueries({ queryKey: ["costing"] })
        },
    })
}
