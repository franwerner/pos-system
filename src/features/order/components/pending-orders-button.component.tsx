"use client"

import { ClipboardList } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import useGetOrders from "../hooks/useGetOrders.hook"

export default function PendingOrdersButton() {
    const { data: orders } = useGetOrders("pending")

    const pendingCount = orders?.length ?? 0

    return (
        <Button variant="outline" className="relative" asChild>
            <Link href="/pos/orders">
                <ClipboardList className="h-4 w-4" />
                Pendientes
                {pendingCount > 0 && (
                    <Badge className="ml-1" variant="destructive">{pendingCount}</Badge>
                )}
            </Link>
        </Button>
    )
}
