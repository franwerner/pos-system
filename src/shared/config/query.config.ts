import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
export default function queryConfig() {
    const queryClient = new QueryClient({
        queryCache: new QueryCache({
            onError: (error) => {
                console.log(error)
                toast.error(error.message)
                toast("Something went wrong", {
                    duration: 5000
                })
            }
        }),
        mutationCache: new MutationCache({
            onError: (error) => {
                toast.error(error.message)
                toast("Something went wrong", {
                    duration: 5000
                })
            }
        })
    })
    return queryClient
}