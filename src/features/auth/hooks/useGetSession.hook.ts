import { useQuery } from "@tanstack/react-query"
import { type SessionUser } from "../types/session.type"

const fetchSession = async (): Promise<SessionUser | null> => {
    const response = await fetch("/api/auth/me")

    if (response.status === 401) return null
    if (!response.ok) throw new Error("No se pudo leer la sesión")

    const { user } = await response.json()

    return user
}

export default function useGetSession() {
    return useQuery({
        queryKey: ["session"],
        queryFn: fetchSession,
        retry: false,
    })
}
