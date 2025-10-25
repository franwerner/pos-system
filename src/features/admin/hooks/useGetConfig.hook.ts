import { useQuery } from "@tanstack/react-query"
import configData from "../data/config.data"

export default function useGetConfig() {
    return useQuery({
        queryKey: ["config"],
        queryFn: async () => {

            return configData
        },
        staleTime: Infinity,
        gcTime: Infinity,
    })
}