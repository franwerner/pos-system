import { useQuery } from "@tanstack/react-query"

export const usePostPayment = () => {

    useQuery({
        queryKey: ["post-payment"],
        queryFn: () => {
            return
        }
    })

}