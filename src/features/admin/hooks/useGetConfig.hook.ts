import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type ConfigPos } from "../types/config.type"

const fetchConfig = async (): Promise<ConfigPos> => {
    const response = await fetch("/api/config")

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetConfig() {
    return useQuery({
        queryKey: ["config"],
        queryFn: fetchConfig,
    })
}
