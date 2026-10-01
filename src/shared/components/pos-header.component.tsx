import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronDown, Clock, LayoutGrid, LogOut, Search, User, UtensilsCrossed, Wallet } from "lucide-react"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { CajaBadge } from "@/shared/components/caja-indicator.component"

export interface PosHeaderProps {
    /** Texto ya tipeado en el buscador (vacío = placeholder "Buscar productos..."). */
    search?: string
    onSearchChange?: (value: string) => void
    cajaOpen: boolean
    cajaInitial?: number
    /** Pedidos pendientes; 0 = sin contador. */
    pendingCount: number
    userName?: string
    onLogout?: () => void
    /** Tablet vertical: sin título, badge corto y menú de usuario solo con ícono. */
    compact?: boolean
}

/** Header de /pos (72px): marca, título, buscador, caja, Pendientes y menú de usuario (Administración, Caja, Salir). Todo tocable ≥ 44px. */
export function PosHeader({
    search,
    onSearchChange,
    cajaOpen,
    cajaInitial,
    pendingCount,
    userName = "Mostrador",
    onLogout,
    compact,
}: PosHeaderProps) {
    return (
        <header className="flex h-[72px] items-center gap-3.5 border-b border-border bg-card px-5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <UtensilsCrossed className="size-5" aria-hidden />
            </span>
            {!compact && (
                <>
                    <span className="h-10 w-px bg-border" aria-hidden />
                    <span className="whitespace-nowrap text-lg font-bold">Punto de venta</span>
                </>
            )}
            <div className="relative ml-2 min-w-40 max-w-[360px] flex-1">
                <Search
                    className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                />
                <Input
                    type="search"
                    aria-label="Buscar productos"
                    placeholder="Buscar productos..."
                    value={search}
                    onChange={(event) => onSearchChange?.(event.target.value)}
                    className="h-12 rounded-lg pl-11 text-[17px]"
                />
            </div>
            <div className="flex-1" />
            <CajaBadge open={cajaOpen} initialAmount={cajaInitial} short={compact} href="/admin/cash" />
            <Button asChild variant="outline" size="lg" className="h-12 gap-2 text-base">
                <Link href="/pos/orders">
                    <Clock className="size-5" aria-hidden />
                    Pendientes
                    {pendingCount > 0 && (
                        <Badge className="h-[22px] min-w-[22px] rounded-full bg-destructive px-1.5 text-xs font-extrabold text-destructive-foreground tabular-nums">
                            {pendingCount}
                        </Badge>
                    )}
                </Link>
            </Button>
            {/* Menú de usuario: antes solo había un botón "Salir", pero desde acá también se llega a Administración y Caja sin tipear la URL. */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="lg"
                        className="h-12 gap-2 text-base"
                        aria-label={`Menú de ${userName}`}
                    >
                        <User className="size-5" aria-hidden />
                        {!compact && (
                            <>
                                {userName}
                                <ChevronDown className="size-4" aria-hidden />
                            </>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[220px]">
                    <DropdownMenuItem asChild className="h-11 cursor-pointer text-base">
                        <Link href="/admin">
                            <LayoutGrid className="size-4" aria-hidden />
                            Administración
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="h-11 cursor-pointer text-base">
                        <Link href="/admin/cash">
                            <Wallet className="size-4" aria-hidden />
                            Caja
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        variant="destructive"
                        className="h-11 cursor-pointer text-base"
                        onClick={onLogout}
                    >
                        <LogOut className="size-4" aria-hidden />
                        Salir
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    )
}

export interface PosPageHeaderProps {
    title: string
    /** Destino del botón de volver (por defecto /pos, sin perder el carrito). */
    backHref?: string
    backLabel?: string
    /** Contenido a la derecha: normalmente <CajaBadge />. */
    right?: ReactNode
}

/** Header de las pantallas internas del POS (checkout, pendientes, ticket): Volver + título + extra a la derecha. */
export function PosPageHeader({ title, backHref = "/pos", backLabel = "Volver al inicio", right }: PosPageHeaderProps) {
    return (
        <header className="flex h-[72px] items-center gap-3.5 border-b border-border bg-card px-5">
            <Button asChild variant="outline" size="lg" className="h-12 gap-2 text-base">
                <Link href={backHref}>
                    <ArrowLeft className="size-5" aria-hidden />
                    {backLabel}
                </Link>
            </Button>
            <h1 className="ml-2 text-[22px] font-bold">{title}</h1>
            <div className="flex-1" />
            {right}
        </header>
    )
}
