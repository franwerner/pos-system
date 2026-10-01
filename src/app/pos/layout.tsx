"use client"
import { Loader2, UtensilsCrossed } from "lucide-react";
import useGetConfig from "@/features/admin/hooks/useGetConfig.hook";
import { CartProvider } from "@/features/cart/context/cart-context";
import ProductFilterProvider from "@/features/products/provider/product-filter.provider";

// Pantalla completa antes de mostrar nada del POS: todavía no hay ni carrito ni
// medio de pago por defecto (vienen de la config), así que no se puede renderizar
// el resto del árbol.
function PosLoading() {
    return (
        <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-background text-foreground" role="status">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <UtensilsCrossed className="size-7" aria-hidden />
            </span>
            <div className="flex items-center gap-2.5">
                <Loader2 className="size-6 animate-spin" aria-hidden />
                <span className="text-lg font-bold">Preparando el punto de venta…</span>
            </div>
            <span className="text-sm text-muted-foreground">Cargando productos, caja y pedidos pendientes.</span>
        </div>
    )
}

export default function PosLayout({ children }: { children: React.ReactNode }) {

    const { data, isLoading } = useGetConfig()

    if (isLoading) {
        return <PosLoading />
    } else if (!data) {
        throw new Error("No se encontro la configuracion")
    }

    return (
        <ProductFilterProvider>
            <CartProvider
                defaultPaymentMethod={data.default_payment}>
                {children}
            </CartProvider>
        </ProductFilterProvider>
    )
}
