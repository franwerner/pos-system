import { useQuery } from "@tanstack/react-query"
import categoriesData from "../data/categories.data"

export const useGetCategories = () => {
    return useQuery({
        queryKey: ["categories"],
        queryFn: () => {
            return categoriesData
        },
        staleTime: Infinity,
        gcTime: Infinity,
    })
}
