import { useRouter } from "next/navigation"
import usePostLogout from "./usePostLogout.hook"

/** Cierre de sesión: mismo flujo para el header de admin y el header del POS. */
export default function useLogout() {
    const router = useRouter()
    const postLogout = usePostLogout()

    const logout = () => {
        postLogout.mutate(undefined, {
            onSuccess: () => {
                router.replace("/login")
                router.refresh()
            },
        })
    }

    return { logout, isPending: postLogout.isPending }
}
