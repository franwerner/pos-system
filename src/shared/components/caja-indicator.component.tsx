import type { ReactNode } from "react"
import Link from "next/link"
import { Wallet } from "lucide-react"
import { cn } from "@/shared/utils/cn.util"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import { Button } from "@/shared/components/ui/button"
import formatCurrency from "@/shared/utils/formatCurrency.util"

/*
 * Indicador de caja: el mismo mensaje en tres tamaños.
 *  - CajaBadge: header del POS (información ambiental, no bloquea).
 *  - CajaAlert: checkout y diálogo "Cobrar pedido" (bloquea el cobro).
 *  - CajaClosedPage: /admin/cash sin sesión abierta.
 * La lógica de si la caja está abierta y su monto inicial vive en `src/features/cash/*`;
 * estos componentes solo reciben el resultado ya calculado.
 */

export interface CajaBadgeProps {
    open: boolean
    /** Fondo inicial de la caja abierta. */
    initialAmount?: number
    /** Solo "Caja abierta" (tablet vertical, poco ancho). */
    short?: boolean
    /** Si se pasa, el badge se vuelve tocable y lleva a esa ruta (ej. /admin/cash desde el header del POS). */
    href?: string
}

export function CajaBadge({ open, initialAmount = 0, short, href }: CajaBadgeProps) {
    const className = cn(
        "inline-flex h-11 items-center gap-1.5 whitespace-nowrap rounded-md px-3.5 text-[15px] font-semibold",
        open
            ? "border border-border bg-muted text-foreground"
            : "bg-destructive-muted text-destructive-muted-foreground",
    )
    const content = (
        <>
            <Wallet className="size-4" aria-hidden />
            {open ? (short ? "Caja abierta" : `Caja abierta — inicial ${formatCurrency(initialAmount)}`) : "Caja cerrada — abrir"}
        </>
    )

    // Sin href queda como indicador puro (checkout, pendientes); con href es un atajo tocable (header del POS).
    if (!href) {
        return <span className={className}>{content}</span>
    }

    return (
        <Link
            href={href}
            className={cn(
                className,
                "transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
        >
            {content}
        </Link>
    )
}

export function CajaAlert({ onOpenCaja }: { onOpenCaja?: () => void }) {
    return (
        <Alert className="flex items-start gap-3 border-transparent bg-destructive-muted text-destructive-muted-foreground">
            <Wallet className="mt-0.5 size-5" aria-hidden />
            <div className="flex-1">
                <AlertTitle className="font-bold">No hay una caja abierta</AlertTitle>
                <AlertDescription className="text-destructive-muted-foreground">
                    Para cobrar hay que abrir la caja con su monto inicial.
                </AlertDescription>
            </div>
            <Button variant="destructive" size="lg" className="h-12" onClick={onOpenCaja}>
                Abrir caja
            </Button>
        </Alert>
    )
}

/** Texto que va debajo del botón de cobro deshabilitado cuando no hay caja. */
export function CajaHint() {
    return <p className="text-center text-sm font-bold text-negative">Abrí la caja para poder cobrar.</p>
}

export function CajaClosedPage({ action }: { action?: ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-xl border-[1.5px] border-dashed border-border px-6 py-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-xl bg-destructive-muted text-destructive-muted-foreground">
                <Wallet className="size-8" aria-hidden />
            </div>
            <p className="text-xl font-bold">No hay una caja abierta</p>
            <p className="max-w-[420px] text-muted-foreground">Sin caja abierta no se puede cobrar en el punto de venta.</p>
            {action}
        </div>
    )
}
