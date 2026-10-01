import type { LucideIcon } from "lucide-react"
import { ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { cn } from "@/shared/utils/cn.util"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { EmptyState } from "@/shared/components/empty-state.component"
import { Money } from "@/shared/components/money.component"
import { ProductPlate, type PlateTone } from "@/shared/components/product-plate.component"

export interface CartItem {
    id: string
    name: string
    unitPrice: number
    quantity: number
    /** Precio de la línea, ya calculado (viene como dato del carrito real). */
    lineTotal: number
    icon?: LucideIcon
    tone?: PlateTone
    imageUrl?: string
}

export interface QuantityStepperProps {
    quantity: number
    name: string
    onIncrease?: () => void
    onDecrease?: () => void
}

/** Stepper −/cantidad/+ del carrito (botones de 44px). Con cantidad 1, "−" es un tacho rojo que quita la línea. */
export function QuantityStepper({ quantity, name, onIncrease, onDecrease }: QuantityStepperProps) {
    const removes = quantity === 1
    return (
        <div className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-card">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDecrease}
                className={cn("size-11 rounded-none", removes && "text-negative hover:text-negative")}
                aria-label={removes ? `Quitar ${name} del pedido` : `Restar uno de ${name}`}
            >
                {removes ? <Trash2 className="size-4" aria-hidden /> : <Minus className="size-5" aria-hidden />}
            </Button>
            <span className="min-w-[34px] text-center text-[17px] font-extrabold tabular-nums">{quantity}</span>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onIncrease}
                className="size-11 rounded-none"
                aria-label={`Sumar uno de ${name}`}
            >
                <Plus className="size-5" aria-hidden />
            </Button>
        </div>
    )
}

/** Línea editable del carrito. */
export function CartLine({ item, onIncrease, onDecrease }: { item: CartItem; onIncrease?: () => void; onDecrease?: () => void }) {
    return (
        <div className="flex items-center gap-3 border-b border-border py-3">
            <ProductPlate size="md" icon={item.icon} tone={item.tone} imageUrl={item.imageUrl} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-base font-semibold leading-tight">{item.name}</span>
                <span className="text-[13px] text-muted-foreground tabular-nums">
                    <Money value={item.unitPrice} size="sm" tone="muted" className="font-normal" /> c/u
                </span>
            </div>
            <div className="flex flex-col items-end gap-1.5">
                <Money value={item.lineTotal} className="text-lg" />
                <QuantityStepper quantity={item.quantity} name={item.name} onIncrease={onIncrease} onDecrease={onDecrease} />
            </div>
        </div>
    )
}

export interface CartPanelProps {
    items: CartItem[]
    itemCount: number
    subtotal: number
    onIncrease?: (id: string) => void
    onDecrease?: (id: string) => void
    onCheckout?: () => void
    /** Ancho del panel en tablet horizontal. En vertical se usa dentro de un Sheet con className="w-full border-0". */
    className?: string
}

/** Panel lateral "Carrito" del POS con pie Items/Subtotal y botón grande "Cerrar pedido". */
export function CartPanel({ items, itemCount, subtotal, onIncrease, onDecrease, onCheckout, className }: CartPanelProps) {
    const empty = items.length === 0
    return (
        <aside className={cn("flex w-[380px] flex-col border-l border-border bg-card", className)} aria-label="Carrito">
            <div className="flex items-center justify-between px-5 pb-2.5 pt-[18px]">
                <h2 className="text-[22px] font-bold">Carrito</h2>
                <Badge variant={empty ? "outline" : "secondary"} className={cn("rounded-full font-semibold", !empty && "bg-accent text-accent-foreground")}>
                    {itemCount} items
                </Badge>
            </div>
            {empty ? (
                <div className="flex flex-1 items-center justify-center p-5">
                    <EmptyState variant="plain" icon={ShoppingCart} title="Carrito vacío" description="Tocá un producto para sumarlo al pedido." />
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto px-5">
                    {items.map((it) => (
                        <CartLine key={it.id} item={it} onIncrease={() => onIncrease?.(it.id)} onDecrease={() => onDecrease?.(it.id)} />
                    ))}
                </div>
            )}
            <div className="flex flex-col gap-3 border-t border-border px-5 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">
                            Items: <b className="text-foreground tabular-nums">{itemCount}</b>
                        </span>
                        <span className="font-semibold">Subtotal</span>
                    </div>
                    <Money value={subtotal} size="lg" />
                </div>
                <Button
                    type="button"
                    size="lg"
                    className="h-16 w-full gap-2 rounded-xl text-xl font-extrabold"
                    disabled={empty}
                    onClick={onCheckout}
                >
                    Cerrar pedido
                    {!empty && <ArrowRight className="size-6" aria-hidden />}
                </Button>
            </div>
        </aside>
    )
}
