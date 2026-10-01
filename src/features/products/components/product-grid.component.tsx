"use client"

import { Loader2, RefreshCw, Search, UtensilsCrossed, WifiOff } from "lucide-react"
import { useCart } from "@/features/cart/context/cart-context"
import { EmptyState } from "@/shared/components/empty-state.component"
import { Button } from "@/shared/components/ui/button"
import { Skeleton } from "@/shared/components/ui/skeleton"
import useGetProducts from "../hooks/useGetProducts.hook"
import { useProductFilterContext } from "../provider/product-filter.provider"
import ProductCard from "./product-card.component"

function ProductCardSkeleton() {
    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm">
            <Skeleton className="size-[92px] rounded-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-[22px] w-1/2" />
        </div>
    )
}

/** Encabezado de la grilla: solo aparece con productos para mostrar (no en vacío/error), oculto en vertical. */
function GridHeading({ loading }: { loading: boolean }) {
    return (
        <div className="flex items-center justify-between portrait:hidden">
            <h2 className="text-[22px] font-bold">Todos los productos</h2>
            {loading ? (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground" role="status">
                    <Loader2 className="size-4 animate-spin" aria-hidden /> Cargando productos…
                </span>
            ) : (
                <span className="text-sm text-muted-foreground">Tocá un producto para sumarlo</span>
            )}
        </div>
    )
}

/** Grilla de productos del POS: carga, sin resultados (por búsqueda o categoría), error y catálogo vacío. */
export default function ProductGrid() {
    const { addToCart } = useCart()
    const { filter, setFilter } = useProductFilterContext()
    const { data: products, isLoading, isError, refetch } = useGetProducts(filter)

    if (isLoading) {
        return (
            <>
                <GridHeading loading />
                <div className="grid grid-cols-3 gap-3.5 portrait:grid-cols-2">
                    {Array.from({ length: 6 }, (_, index) => <ProductCardSkeleton key={index} />)}
                </div>
            </>
        )
    }

    if (isError) {
        return (
            <EmptyState
                className="flex-1 justify-center"
                tone="error"
                icon={WifiOff}
                title="No pudimos cargar los productos"
                description="Revisá la conexión a internet. El carrito no se pierde: queda guardado en esta tablet."
                action={
                    <Button size="lg" className="h-12 gap-2 text-base" onClick={() => refetch()}>
                        <RefreshCw className="size-5" aria-hidden /> Reintentar
                    </Button>
                }
            />
        )
    }

    if (!products || products.length === 0) {
        const hasSearch = !!filter.search?.trim()
        const hasCategory = !!filter.category

        if (hasSearch) {
            return (
                <EmptyState
                    className="flex-1 justify-center"
                    icon={Search}
                    title="No encontramos productos con ese nombre"
                    description="Probá con otra palabra o elegí una categoría."
                    action={
                        <Button variant="outline" size="lg" className="h-12 text-base" onClick={() => setFilter({ search: "" })}>
                            Borrar búsqueda
                        </Button>
                    }
                />
            )
        }

        if (hasCategory) {
            return (
                <EmptyState
                    className="flex-1 justify-center"
                    icon={UtensilsCrossed}
                    title="No hay productos en esta categoría"
                    description="Elegí otra categoría o mirá todos los productos."
                    action={
                        <Button variant="outline" size="lg" className="h-12 text-base" onClick={() => setFilter({ category: undefined })}>
                            Ver todos los productos
                        </Button>
                    }
                />
            )
        }

        return (
            <EmptyState
                className="flex-1 justify-center"
                icon={UtensilsCrossed}
                title="Todavía no cargaste productos"
                description="Los productos que actives en el panel de administración van a aparecer acá."
            />
        )
    }

    return (
        <>
            <GridHeading loading={false} />
            <div className="grid grid-cols-3 gap-3.5 portrait:grid-cols-2">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} addToCart={addToCart} />
                ))}
            </div>
        </>
    )
}
