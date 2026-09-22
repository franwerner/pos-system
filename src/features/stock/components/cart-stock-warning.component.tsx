"use client"

import { TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import { type CartShortage } from "../hooks/useGetCartShortages.hook"

interface CartStockWarningProps {
    shortages: CartShortage[]
}

export default function CartStockWarning({ shortages }: CartStockWarningProps) {
    if (shortages.length === 0) return null

    return (
        <Alert variant="destructive" className="mb-6">
            <TriangleAlert />
            <AlertTitle>El stock no alcanza para este pedido</AlertTitle>
            <AlertDescription>
                <p>Se puede cobrar igual: el stock de estos insumos va a quedar en negativo.</p>
                <ul className="mt-1 list-disc pl-4">
                    {shortages.map((shortage) => (
                        <li key={shortage.supply_id}>
                            {shortage.name}: necesita {shortage.required} {shortage.unit} y hay {shortage.available} {shortage.unit}.
                        </li>
                    ))}
                </ul>
            </AlertDescription>
        </Alert>
    )
}
