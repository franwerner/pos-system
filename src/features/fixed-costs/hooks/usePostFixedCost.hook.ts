import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type FixedCost, type FixedCostInput } from "../types/fixed-cost.type"

const createFixedCost = async (input: FixedCostInput): Promise<FixedCost> => {
    const response = await fetch("/api/fixed-costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function usePostFixedCost() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createFixedCost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fixed-costs"] })
            queryClient.invalidateQueries({ queryKey: ["costing"] })
        },
    })
}
