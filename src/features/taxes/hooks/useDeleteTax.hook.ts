import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"

const deleteTax = async (id: number): Promise<number> => {
    const response = await fetch("/api/taxes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    return id
}

export default function useDeleteTax() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteTax,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["taxes"] })
            queryClient.invalidateQueries({ queryKey: ["costing"] })
        },
    })
}
