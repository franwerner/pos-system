import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"

export type PatchConfigInput = {
    waste_percentage_food: number
    waste_percentage_drink: number
    waste_percentage_packaging: number
    default_employee_id?: string | null
    default_payment_id?: number | null
}

const patchConfig = async (values: PatchConfigInput): Promise<PatchConfigInput> => {
    const response = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function usePatchConfig() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: patchConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["config"] })
            queryClient.invalidateQueries({ queryKey: ["costing"] })
        },
    })
}
