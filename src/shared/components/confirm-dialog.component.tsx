"use client"

import { Loader2 } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog"
import { cn } from "@/shared/utils/cn.util"

export interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    /** Corto: "Desactivar producto", "Cancelar el pedido #1". */
    title: string
    /** La consecuencia real: qué se conserva, qué vuelve atrás. */
    description: string
    cancelLabel?: string
    confirmLabel: string
    /**
     * true solo si la acción destruye o revierte algo (cancelar pedido, eliminar costo fijo).
     * Desactivar/Reactivar NO es destructivo: botón primario común.
     */
    destructive?: boolean
    /** Mientras se confirma: botones deshabilitados y pendingLabel con spinner (ej. "Cancelando..."). */
    pending?: boolean
    pendingLabel?: string
}

/** Confirmación de estado o destructiva: AlertDialog controlado, no un Dialog de formulario. */
export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    cancelLabel = "Volver",
    confirmLabel,
    destructive,
    pending,
    pendingLabel,
}: ConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="rounded-2xl sm:max-w-[460px]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-extrabold">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-[15px]">{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={pending}
                        onClick={(event) => {
                            event.preventDefault()
                            onConfirm()
                        }}
                        className={cn(destructive && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
                    >
                        {pending ? (
                            <>
                                <Loader2 className="size-4 animate-spin" aria-hidden /> {pendingLabel ?? confirmLabel}
                            </>
                        ) : (
                            confirmLabel
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
