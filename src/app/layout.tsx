import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import type React from "react"
import "./globals.css"
import { Providers } from "./providers"

// Tipografía única del diseño (Design/export/00-tokens/fonts.md): se expone como
// variable CSS para que `--font-sans` del @theme inline la resuelva.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "POS System",
  description: "Point of Sale System",
  generator: 'v0.app'
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={jakarta.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
