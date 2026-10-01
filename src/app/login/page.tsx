import { UtensilsCrossed } from "lucide-react"
import LoginForm from "@/features/auth/components/login-form.component"

const DEFAULT_REDIRECT = "/pos"

// Solo rutas internas: un `next` con host propio convertiría el login en un
// redirector abierto hacia cualquier sitio.
const resolveRedirect = (next: string | string[] | undefined) =>
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
        ? next
        : DEFAULT_REDIRECT

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ next?: string | string[] }>
}) {
    const { next } = await searchParams

    return (
        <main className="flex min-h-dvh items-center justify-center bg-background p-4">
            <div className="flex w-full max-w-[460px] flex-col gap-5 rounded-2xl border border-border bg-card px-6 py-7 text-card-foreground shadow-md sm:px-9 sm:pb-8 sm:pt-9">
                <div className="flex flex-col items-center gap-3.5 text-center">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                        <UtensilsCrossed className="size-7" aria-hidden />
                    </span>
                    <div className="flex flex-col gap-1.5">
                        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">Punto de venta</h1>
                        <p className="text-base text-muted-foreground">Entrá con tu usuario para operar el sistema.</p>
                    </div>
                </div>

                <LoginForm next={resolveRedirect(next)} />
            </div>
        </main>
    )
}
