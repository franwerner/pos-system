"use client"

import { Wallet } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import { Button } from "@/shared/components/ui/button"

export default function CashSessionAlert() {
    return (
        <Alert variant="destructive" className="mb-6">
            <Wallet />
            <AlertTitle>No hay una caja abierta</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3">
                <p>Para cobrar hay que abrir la caja con su monto inicial.</p>
                <Button size="sm" variant="outline" asChild>
                    <Link href="/admin/cash">Abrir caja</Link>
                </Button>
            </AlertDescription>
        </Alert>
    )
}
