import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type ProductionWithDetail } from "../types/production.type"

const fetchProductions = async (): Promise<ProductionWithDetail[]> => {
    const response = await fetch("/api/production")

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetProductions() {
    return useQuery({
        queryKey: ["productions"],
        queryFn: fetchProductions,
    })
}
