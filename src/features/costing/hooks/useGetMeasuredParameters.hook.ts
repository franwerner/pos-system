import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type MeasuredParameters } from "../types/costing.type"

const fetchMeasuredParameters = async (month?: string): Promise<MeasuredParameters> => {
    const response = await fetch(`/api/costing/measured${month ? `?month=${month}` : ""}`)

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetMeasuredParameters(month?: string) {
    return useQuery({
        queryKey: ["costing", "measured", month ?? "current"],
        queryFn: () => fetchMeasuredParameters(month),
    })
}
