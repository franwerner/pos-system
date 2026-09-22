import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type Supply } from "@/features/supplies/types/supply.type"
import { type ProducibleSupply } from "../types/production.type"

const fetchProducibleSupplies = async (): Promise<ProducibleSupply[]> => {
    const response = await fetch(
        "/api/supplies?origin=produced&onlyActive=true&onlyProducible=true",
    )

    if (!response.ok) throw new Error(await readApiError(response))

    const supplies: Supply[] = await response.json()

    return supplies.map((supply) => ({
        id: supply.id,
        name: supply.name,
        unit: supply.unit,
    }))
}

export default function useGetProducibleSupplies() {
    return useQuery({
        queryKey: ["producible-supplies"],
        queryFn: fetchProducibleSupplies,
    })
}
