import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type ProductionInput } from "../types/production.type"

const createProduction = async (input: ProductionInput): Promise<number> => {
    const response = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    const { id } = await response.json()

    return id
}

export default function usePostProduction() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createProduction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["productions"] })
            queryClient.invalidateQueries({ queryKey: ["production-components"] })
            queryClient.invalidateQueries({ queryKey: ["supply-stock"] })
            queryClient.invalidateQueries({ queryKey: ["stock-movements"] })
            queryClient.invalidateQueries({ queryKey: ["costing"] })
        },
    })
}
