import { useQuery } from "@tanstack/react-query"
import { fetchOpenCashSession } from "../queries/cash-session.query"

export default function useGetOpenCashSession() {
    return useQuery({
        queryKey: ["cash-session", "open"],
        queryFn: fetchOpenCashSession,
    })
}
