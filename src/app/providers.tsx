"use client"
import { useState } from "react"
import { ThemeProvider } from "next-themes"
import queryConfig from "@/shared/config/query.config"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/shared/components/ui/sonner"

export const Providers = ({ children }: { children: React.ReactNode }) => {
    const [queryClient] = useState(queryConfig)

    return (
        <ThemeProvider>
            <Toaster />
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </ThemeProvider>
    )
}
