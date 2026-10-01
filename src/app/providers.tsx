"use client"
import { useState } from "react"
import { ThemeProvider } from "next-themes"
import queryConfig from "@/shared/config/query.config"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/shared/components/ui/sonner"

export const Providers = ({ children }: { children: React.ReactNode }) => {
    const [queryClient] = useState(queryConfig)

    return (
        // attribute="class" es obligatorio: sin esto next-themes aplica su default
        // (`data-theme` en <html>), pero todo `globals.css` / Tailwind (`.dark *`) espera
        // la clase `dark`. Sin este prop el modo oscuro queda roto (verificado con captura).
        // Fijo en claro por ahora: no hay selector de tema y en el mostrador el claro se
        // lee mejor. El modo oscuro queda definido en globals.css para cuando se agregue.
        <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
            <Toaster />
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </ThemeProvider>
    )
}
