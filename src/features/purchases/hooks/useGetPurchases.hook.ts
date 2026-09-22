import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type PurchaseWithItems } from "../types/purchase.type"

const fetchPurchases = async (): Promise<PurchaseWithItems[]> => {
    const response = await fetch("/api/purchases")

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export default function useGetPurchases() {
    return useQuery({
        queryKey: ["purchases"],
        queryFn: fetchPurchases,
    })
}
