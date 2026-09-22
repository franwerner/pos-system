import LoginForm from "@/features/auth/components/login-form.component"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/components/ui/card"

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
        <div className="flex min-h-dvh items-center justify-center bg-background p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Punto de venta</CardTitle>
                    <CardDescription>Entrá con tu usuario para operar el sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm next={resolveRedirect(next)} />
                </CardContent>
            </Card>
        </div>
    )
}
