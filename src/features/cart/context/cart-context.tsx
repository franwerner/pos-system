"use client"

import productsData from "@/features/products/data/products.data"
import { Product } from "@/features/products/types/product.type"
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { Payment } from "../../payment/types/payment.type"
import { calculateCart } from "../services/calculateCart.service"


export interface ProductCartItem extends Product {
  quantity: number
}

interface CartContextType {
  cart: ProductCartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  getCalculatedCart: () => ReturnType<typeof calculateCart>
  clearCart: () => void
  paymentMethod: Payment
  setPaymentMethod: (paymentMethod: Payment) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children, defaultPaymentMethod }: { children: ReactNode, defaultPaymentMethod: Payment }) {
  const [cart, setCart] = useState<ProductCartItem[]>([{ ...productsData[0], quantity: 2 }])
  const [paymentMethod, setPaymentMethod] = useState<Payment>(defaultPaymentMethod)

  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart))
  }, [cart])

  const addToCart = useCallback((product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)
      if (existingItem) {
        return prevCart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart((prevCart) => prevCart.map((item) => (item.id === productId ? { ...item, quantity } : item)))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])



  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        getCalculatedCart: () => calculateCart(cart, paymentMethod),
        clearCart,
        paymentMethod,
        setPaymentMethod
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
