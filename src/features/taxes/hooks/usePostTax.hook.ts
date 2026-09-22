import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type Tax, type TaxInput } from "../types/tax.type"

const createTax = async (input: TaxInput): Promise<Tax> => {
    const response = await fetch("/api/taxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function usePostTax() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createTax,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["taxes"] })
            queryClient.invalidateQueries({ queryKey: ["costing"] })
        },
    })
}
