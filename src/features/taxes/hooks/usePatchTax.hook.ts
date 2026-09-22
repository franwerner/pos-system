import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type Tax, type TaxInput } from "../types/tax.type"

export type PatchTaxInput = Partial<TaxInput> & { id: number }

const patchTax = async (input: PatchTaxInput): Promise<Tax> => {
    const response = await fetch("/api/taxes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function usePatchTax() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: patchTax,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["taxes"] })
            queryClient.invalidateQueries({ queryKey: ["costing"] })
        },
    })
}
