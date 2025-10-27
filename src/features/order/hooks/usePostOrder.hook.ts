import { useQuery } from "@tanstack/react-query"

export const usePostOrder = () => {
    return useQuery({
        queryKey: ["post-order"],
        queryFn: () => {
            return
        }
    })
}