import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "../services/readApiError.service"

const logout = async (): Promise<void> => {
    const response = await fetch("/api/auth/logout", { method: "POST" })

    if (!response.ok) throw new Error(await readApiError(response))
}

export default function usePostLogout() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: logout,
        onSuccess: () => {
            queryClient.clear()
        },
    })
}
