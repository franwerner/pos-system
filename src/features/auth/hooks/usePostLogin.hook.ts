import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readApiError } from "../services/readApiError.service"
import { type LoginInput, type SessionUser } from "../types/session.type"

const login = async (input: LoginInput): Promise<SessionUser> => {
    const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    })

    if (!response.ok) throw new Error(await readApiError(response))

    const { user } = await response.json()

    return user
}

export default function usePostLogin() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: login,
        onSuccess: (user) => {
            queryClient.setQueryData(["session"], user)
        },
    })
}
