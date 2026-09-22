import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type Tax } from "../types/tax.type"

const fetchTaxes = async (activeOnly: boolean): Promise<Tax[]> => {
    const response = await fetch(`/api/taxes${activeOnly ? "?active=true" : ""}`)

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetTaxes(activeOnly: boolean = false) {
    return useQuery({
        queryKey: ["taxes", activeOnly],
        queryFn: () => fetchTaxes(activeOnly),
    })
}
