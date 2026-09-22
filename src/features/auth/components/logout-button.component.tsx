"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/components/ui/button"
import useGetSession from "../hooks/useGetSession.hook"
import usePostLogout from "../hooks/usePostLogout.hook"

export default function LogoutButton() {
    const router = useRouter()
    const { data: user } = useGetSession()
    const postLogout = usePostLogout()

    const onLogout = () => {
        postLogout.mutate(undefined, {
            onSuccess: () => {
                router.replace("/login")
                router.refresh()
            },
        })
    }

    return (
        <div className="flex items-center gap-2">
            {user && <span className="text-sm text-muted-foreground">{user.username}</span>}
            <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={onLogout}
                disabled={postLogout.isPending}>
                <LogOut />
                Salir
            </Button>
        </div>
    )
}
