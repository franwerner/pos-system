"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import useGetSession from "../hooks/useGetSession.hook"
import useLogout from "../hooks/useLogout.hook"

export default function LogoutButton() {
    const { data: user } = useGetSession()
    const { logout, isPending } = useLogout()

    return (
        <div className="flex items-center gap-2">
            {user && <span className="text-sm text-muted-foreground">{user.username}</span>}
            <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={logout}
                disabled={isPending}>
                <LogOut />
                Salir
            </Button>
        </div>
    )
}
