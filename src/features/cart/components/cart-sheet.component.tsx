"use client"

import { ShoppingCart, X } from "lucide-react"
import { useState } from "react"
import { Money } from "@/shared/components/money.component"
import { Button } from "@/shared/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/shared/components/ui/sheet"
import { cn } from "@/shared/utils/cn.util"
import { CartPanel, type CartPanelProps } from "@/shared/components/cart.component"

/**
 * Tablet vertical: barra fija abajo "Ver pedido · N items" que abre el carrito en un Sheet
 * desde el fondo, con el subtotal y un "Cerrar pedido" directo (sin abrir el carrito).
 */
export function CartSheet({ items, itemCount, subtotal, onIncrease, onDecrease, onCheckout, className }: CartPanelProps) {
    const [open, setOpen] = useState(false)
    const empty = items.length === 0

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <div className={cn("fixed inset-x-4 bottom-4 z-40 flex items-center gap-3.5 rounded-[18px] bg-foreground py-3 pl-5 pr-3 text-background shadow-lg", className)}>
                <SheetTrigger asChild>
                    <button type="button" className="flex min-h-14 flex-1 items-center gap-3.5 text-left">
                        <ShoppingCart className="size-6" aria-hidden />
                        <span className="flex flex-1 flex-col">
                            <span className="font-semibold">Ver pedido · {itemCount} items</span>
                            <span className="text-xs text-background/75">Tocá para revisar cantidades</span>
                        </span>
                        <Money value={subtotal} size="lg" className="text-[26px] text-background" />
                    </button>
                </SheetTrigger>
                <Button size="lg" className="h-14 rounded-xl px-6 text-xl font-extrabold" disabled={empty} onClick={onCheckout}>
                    Cerrar pedido
                </Button>
            </div>
            <SheetContent side="bottom" className="h-[640px] gap-0 rounded-t-[20px] border-0 p-0 [&>button:last-child]:hidden">
                <SheetTitle className="sr-only">Carrito</SheetTitle>
                <div className="mx-auto mt-2.5 h-[5px] w-11 shrink-0 rounded-full bg-border" aria-hidden />
                <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="absolute right-4 top-[26px] size-11" aria-label="Cerrar carrito">
                        <X className="size-5" aria-hidden />
                    </Button>
                </SheetClose>
                <CartPanel
                    items={items}
                    itemCount={itemCount}
                    subtotal={subtotal}
                    onIncrease={onIncrease}
                    onDecrease={onDecrease}
                    onCheckout={onCheckout}
                    className="min-h-0 w-full flex-1 border-0 bg-popover [&>div:first-child]:pr-16"
                />
            </SheetContent>
        </Sheet>
    )
}
