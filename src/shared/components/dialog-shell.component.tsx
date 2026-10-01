"use client"

import type { ReactNode } from "react"
import { ArrowLeft, X } from "lucide-react"
import { cn } from "@/shared/utils/cn.util"
import { Button } from "@/shared/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/components/ui/dialog"

export interface DialogShellProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    /** Texto de la barra superior en celular ("Nueva compra", "Detalle de compra"). */
    mobileBarTitle: string
    /** true = en celular el título y la bajada se ven debajo de la barra (detalle). */
    mobileShowTitle?: boolean
    /** Descripción corta que reemplaza a la bajada en celular. */
    mobileDescription?: string
    /** Clase de ancho máximo en escritorio (ej. "sm:max-w-[940px]"). */
    widthClass: string
    children: ReactNode
    footer: ReactNode
    /** Clases extra del pie (ej. "hidden sm:flex" si en celular no hay pie). */
    footerClassName?: string
}

/**
 * Diálogo con pie libre (para cuando el `Dialog` común no alcanza): el pie lleva un total o un
 * costo al lado de los botones (Compras, Producción) o es un detalle de solo lectura. Escritorio:
 * diálogo centrado. Celular (< sm): pantalla completa con barra superior y flecha "Volver"; el
 * pie queda fijo abajo.
 */
export function DialogShell({
    open,
    onOpenChange,
    title,
    description,
    mobileBarTitle,
    mobileShowTitle,
    mobileDescription,
    widthClass,
    children,
    footer,
    footerClassName,
}: DialogShellProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className={cn(
                    "flex h-dvh max-h-dvh w-full max-w-full flex-col gap-0 rounded-none p-0",
                    "sm:h-auto sm:max-h-[92dvh] sm:rounded-2xl",
                    widthClass,
                )}
            >
                <div className="flex h-[60px] shrink-0 items-center gap-3 border-b border-border bg-card px-4 sm:hidden">
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="size-11" aria-label="Volver">
                            <ArrowLeft className="size-5" aria-hidden />
                        </Button>
                    </DialogClose>
                    <span className="text-lg font-bold" aria-hidden={mobileShowTitle ? undefined : true}>
                        {mobileBarTitle}
                    </span>
                </div>
                <DialogHeader
                    className={cn(
                        "gap-1 text-left sm:px-6 sm:pt-[22px]",
                        mobileShowTitle ? "px-4 pt-4" : "sr-only sm:not-sr-only",
                    )}
                >
                    <div className="flex items-center justify-between gap-3">
                        <DialogTitle className="text-[22px] font-bold sm:text-xl sm:font-extrabold">{title}</DialogTitle>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="hidden size-8 sm:inline-flex" aria-label="Cerrar">
                                <X className="size-5" aria-hidden />
                            </Button>
                        </DialogClose>
                    </div>
                    <DialogDescription className="text-sm">
                        {mobileDescription ? (
                            <>
                                <span className="sm:hidden">{mobileDescription}</span>
                                <span className="hidden sm:inline">{description}</span>
                            </>
                        ) : (
                            description
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:px-6 sm:py-5">{children}</div>
                <DialogFooter
                    className={cn(
                        "flex-col gap-2.5 border-t border-border bg-card px-4 pb-3.5 pt-3 shadow-lg sm:flex-row sm:items-center sm:bg-transparent sm:px-6 sm:py-4 sm:shadow-none",
                        footerClassName,
                    )}
                >
                    {footer}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
