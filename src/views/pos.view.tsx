"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import useLogout from "@/features/auth/hooks/useLogout.hook"
import useGetSession from "@/features/auth/hooks/useGetSession.hook"
import { CartSheet } from "@/features/cart/components/cart-sheet.component"
import { useCart } from "@/features/cart/context/cart-context"
import useGetOpenCashSession from "@/features/cash/hooks/useGetOpenCashSession.hook"
import useGetOrders from "@/features/order/hooks/useGetOrders.hook"
import CategoryChips from "@/features/products/components/category-chips.component"
import CategorySidebar from "@/features/products/components/category-sidebar.component"
import ProductGrid from "@/features/products/components/product-grid.component"
import { useProductFilterContext } from "@/features/products/provider/product-filter.provider"
import { resolveCategoryVisual } from "@/features/products/services/resolveCategoryVisual.service"
import { CartPanel } from "@/shared/components/cart.component"
import { PosHeader } from "@/shared/components/pos-header.component"

export default function POSView() {
    const router = useRouter()
    const { filter, setFilter } = useProductFilterContext()
    const { data: session } = useGetSession()
    const { logout } = useLogout()
    const { data: cashSession } = useGetOpenCashSession()
    const { data: pendingOrders } = useGetOrders("pending")
    const { cart, removeFromCart, updateQuantity, getCalculatedCart } = useCart()

    // El buscador tipea local y solo dispara el filtro real (que refetchea productos)
    // 500 ms después de la última tecla; sincroniza con el contexto si algo lo limpia
    // desde afuera (ej. "Borrar búsqueda" del estado sin resultados).
    const [search, setSearch] = useState(filter.search)
    useEffect(() => setSearch(filter.search), [filter.search])
    useEffect(() => {
        const timeout = setTimeout(() => setFilter({ search }), 500)
        return () => clearTimeout(timeout)
    }, [search, setFilter])

    const { itemCount, subTotal } = getCalculatedCart()
    const cartItems = cart.map((item) => ({
        id: String(item.id),
        name: item.name,
        unitPrice: item.price,
        quantity: item.quantity,
        lineTotal: item.price * item.quantity,
        imageUrl: item.img_url ?? undefined,
        ...resolveCategoryVisual(item.category?.name),
    }))

    // Con cantidad 1, restar saca la línea del carrito en vez de dejarla en 0 (bug real
    // que el diseño hizo explícito: "no existe cantidad 0" en el carrito del POS).
    const handleDecrease = (id: string) => {
        const numericId = Number(id)
        const item = cart.find((cartItem) => cartItem.id === numericId)
        if (!item) return
        if (item.quantity <= 1) removeFromCart(numericId)
        else updateQuantity(numericId, item.quantity - 1)
    }
    const handleIncrease = (id: string) => {
        const numericId = Number(id)
        const item = cart.find((cartItem) => cartItem.id === numericId)
        if (!item) return
        updateQuantity(numericId, item.quantity + 1)
    }
    const handleCheckout = () => router.push("/pos/checkout")

    const header = {
        search,
        onSearchChange: setSearch,
        cajaOpen: !!cashSession,
        cajaInitial: cashSession?.opening_amount,
        pendingCount: pendingOrders?.length ?? 0,
        userName: session?.username,
        onLogout: logout,
    }

    const cartProps = {
        items: cartItems,
        itemCount,
        subtotal: subTotal,
        onIncrease: handleIncrease,
        onDecrease: handleDecrease,
        onCheckout: handleCheckout,
    }

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <div className="portrait:hidden">
                <PosHeader {...header} />
            </div>
            <div className="landscape:hidden">
                <PosHeader {...header} compact />
            </div>
            <CategoryChips className="landscape:hidden" />
            <div className="flex min-h-0 flex-1">
                <CategorySidebar className="portrait:hidden" />
                <main className="flex min-w-0 flex-1 flex-col gap-3.5 overflow-y-auto p-[18px] portrait:pb-32">
                    <ProductGrid />
                </main>
                <CartPanel {...cartProps} className="portrait:hidden" />
            </div>
            <CartSheet {...cartProps} className="landscape:hidden" />
        </div>
    )
}
