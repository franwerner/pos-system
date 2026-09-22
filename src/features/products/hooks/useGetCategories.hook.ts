import { useQuery } from "@tanstack/react-query"
import { readApiError } from "@/features/auth/services/readApiError.service"
import { type Category } from "../types/category.type"

const fetchCategories = async (): Promise<Category[]> => {
    const response = await fetch("/api/categories")

    if (!response.ok) throw new Error(await readApiError(response))

    return response.json()
}

export const useGetCategories = () => {
    return useQuery({
        queryKey: ["categories"],
        queryFn: fetchCategories,
    })
}
