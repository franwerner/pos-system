"use client"

import { Check, Clock, type LucideIcon, Wallet } from "lucide-react"
import { cn } from "@/shared/utils/cn.util"

export type CheckoutMode = "pay" | "pending"

const MODES: { id: CheckoutMode; title: string; help: string; icon: LucideIcon }[] = [
    { id: "pay", title: "Cobrar ahora", help: "Se registra el pago y queda cobrado.", icon: Wallet },
    { id: "pending", title: "Dejar pendiente", help: "Se prepara igual y se cobra después.", icon: Clock },
]

interface CloseModeSelectorProps {
    mode: CheckoutMode
    onChange: (mode: CheckoutMode) => void
}

/**
 * La bifurcación principal del checkout: dos tarjetas grandes tocables (role="radio"),
 * no pestañas — tiene que leerse como una decisión, no como dos vistas intercambiables.
 */
export default function CloseModeSelector({ mode, onChange }: CloseModeSelectorProps) {
    return (
        <div className="flex flex-col gap-2.5">
            <h2 id="close-mode" className="text-lg font-bold">¿Cómo cerrás el pedido?</h2>
            <div role="radiogroup" aria-labelledby="close-mode" className="grid grid-cols-2 gap-3">
                {MODES.map((option) => {
                    const on = option.id === mode
                    const Icon = option.icon

                    return (
                        <button
                            key={option.id}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => onChange(option.id)}
                            className={cn(
                                "flex min-h-24 items-start gap-3.5 rounded-2xl p-[18px] text-left text-foreground transition",
                                on
                                    ? "border-2 border-brand bg-accent"
                                    : "border border-border bg-card hover:border-muted-foreground/40",
                            )}
                        >
                            <span
                                className={cn(
                                    "flex size-12 shrink-0 items-center justify-center rounded-xl",
                                    on ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                                )}
                            >
                                <Icon className="size-6" aria-hidden />
                            </span>
                            <span className="flex flex-1 flex-col gap-1">
                                <span className="text-[19px] font-extrabold">{option.title}</span>
                                <span className={cn("text-sm", on ? "text-accent-foreground" : "text-muted-foreground")}>
                                    {option.help}
                                </span>
                            </span>
                            {on ? (
                                <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    <Check className="size-4" aria-hidden />
                                </span>
                            ) : (
                                <span className="size-[26px] shrink-0 rounded-full border-2 border-input" aria-hidden />
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
