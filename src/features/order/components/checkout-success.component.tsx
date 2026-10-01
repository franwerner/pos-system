import { Check, Loader2 } from "lucide-react"

/**
 * Pantalla de transición tras cobrar (no aplica a "dejar pendiente": ese caso ya
 * vuelve a /pos/orders con su propio toast). Se muestra mientras `router.push` al
 * ticket resuelve, así el cajero no ve un loader genérico entre dos pantallas.
 */
export default function CheckoutSuccess() {
    return (
        <div
            className="flex h-dvh flex-col items-center justify-center gap-3.5 bg-background text-foreground"
            role="status"
        >
            <div className="flex size-[72px] items-center justify-center rounded-full bg-success-muted text-success-muted-foreground">
                <Check className="size-10" aria-hidden />
            </div>
            <p className="text-[22px] font-bold">Pago registrado</p>
            <p className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Abriendo el ticket…
            </p>
        </div>
    )
}
