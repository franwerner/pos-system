"use client"

import OrderAmount from "@/features/order/components/order-amount.component"
import { Button } from "@/shared/components/ui/button"
import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useCart } from "../context/cart-context"
import EmptyCart from "./empty-cart.component"
import ProductItemCart from "./product-cart.component"

export default function CartSidebar() {
  const { cart, removeFromCart, updateQuantity, getCalculatedCart } = useCart()

  const { itemCount } = getCalculatedCart()


  return (
    <div className="flex w-[350px] flex-col border-l bg-background">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="flex gap-2 items-center text-lg ">
          <ShoppingCart size={26} strokeWidth={1} />
          <span className="mt-1">Carrito</span>
        </h2>
        <span className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
          {itemCount} items
        </span>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {cart.length === 0 ?
          <EmptyCart />
          :
          <div className="space-y-4">
            {cart.map((item) => (
              <ProductItemCart
                key={item.id}
                item={item}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart} />
            ))}
          </div>
        }
      </div>
      <div className="space-y-6 p-4">
        <OrderAmount />
        <Button
          asChild
          className="w-full"
          size="lg">
          <Link href={"/pos/checkout"}>Checkout</Link>
        </Button>
      </div>
    </div>
  )
}
