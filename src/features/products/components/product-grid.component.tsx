"use client"
import { useCart } from "@/features/cart/context/cart-context"
import useGetProducts from "../hooks/useGetProducts.hook"
import { useProductFilterContext } from "../provider/product-filter.provider"
import ProductCard from "./product-card.component"


export default function ProductGrid() {
  const { addToCart } = useCart()

  const { filter } = useProductFilterContext()

  const { data: products } = useGetProducts(filter)

  return (
    <div className="p-3 overflow-auto">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {products?.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            addToCart={addToCart} />
        ))}
      </div>
    </div>
  )
}
