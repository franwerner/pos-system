"use client"

import { Wallet } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/shared/components/ui/badge"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import useGetOpenCashSession from "../hooks/useGetOpenCashSession.hook"

export default function CashSessionStatus() {
    const { data: session, isLoading } = useGetOpenCashSession()

    if (isLoading) return null

    if (!session) {
        return (
            <Badge variant="destructive" asChild>
                <Link href="/admin/cash">
                    <Wallet />
                    Caja cerrada — abrir
                </Link>
            </Badge>
        )
    }

    return (
        <Badge variant="secondary" asChild>
            <Link href="/admin/cash">
                <Wallet />
                Caja abierta — inicial {formatCurrency(session.opening_amount)}
            </Link>
        </Badge>
    )
}
