"use client"
import { useCart } from "@/features/cart/context/cart-context"
import useGetProducts from "../hooks/useGetProducts.hook"
import { useProductFilterContext } from "../provider/product-filter.provider"
import ProductCard from "./product-card.component"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Loader } from "@/shared/components/loader.component"


export default function ProductGrid() {
  const { addToCart } = useCart()

  const { filter } = useProductFilterContext()

  const { data: products, isLoading } = useGetProducts(filter)

  if (isLoading) return <Loader />

  return (
    <ScrollArea className="p-3 overflow-auto h-full">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
        {products?.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            addToCart={addToCart} />
        ))}
      </div>
    </ScrollArea>
  )
}
