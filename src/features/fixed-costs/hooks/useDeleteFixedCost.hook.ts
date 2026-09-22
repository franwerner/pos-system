import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"

const deleteFixedCost = async (id: number): Promise<number> => {
    const response = await fetch(`/api/fixed-costs/${id}`, { method: "DELETE" })

    if (!response.ok) throw new Error(await readApiError(response))

    return id
}

export default function useDeleteFixedCost() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteFixedCost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fixed-costs"] })
            queryClient.invalidateQueries({ queryKey: ["costing"] })
        },
    })
}
