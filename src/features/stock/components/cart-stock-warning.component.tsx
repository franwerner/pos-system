"use client"

import { TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import { type CartShortage } from "../hooks/useGetCartShortages.hook"

interface CartStockWarningProps {
    shortages: CartShortage[]
}

/** Informativa, nunca bloquea: el diseño la marca en amarillo, no en rojo, porque cobrar sigue habilitado. */
export default function CartStockWarning({ shortages }: CartStockWarningProps) {
    if (shortages.length === 0) return null

    return (
        <Alert role="status" className="flex items-start gap-3 border-transparent bg-warning-muted text-warning-muted-foreground">
            <TriangleAlert className="mt-0.5 size-5" aria-hidden />
            <div>
                <AlertTitle className="text-[15px] font-bold">El stock no alcanza para este pedido</AlertTitle>
                <AlertDescription className="text-warning-muted-foreground">
                    <p>Se puede cobrar igual: el stock de estos insumos va a quedar en negativo.</p>
                    <ul className="mt-1 list-disc pl-4">
                        {shortages.map((shortage) => (
                            <li key={shortage.supply_id}>
                                <b>{shortage.name}:</b> necesita {shortage.required} {shortage.unit} y hay {shortage.available} {shortage.unit}.
                            </li>
                        ))}
                    </ul>
                </AlertDescription>
            </div>
        </Alert>
    )
}
