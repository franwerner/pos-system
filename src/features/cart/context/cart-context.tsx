"use client"

import { Product } from "@/features/products/types/product.type"
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { Payment } from "../../payment/types/payment.type"
import { calculateCart } from "../services/calculateCart.service"
import { CART_STORAGE_KEY, readStoredCart } from "../services/readStoredCart.service"


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
  const [cart, setCart] = useState<ProductCartItem[]>([])
  const [isCartHydrated, setIsCartHydrated] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<Payment>(defaultPaymentMethod)

  // localStorage no existe durante el render del servidor, así que el carrito
  // guardado solo puede entrar después del montaje.
  useEffect(() => {
    setCart(readStoredCart(localStorage.getItem(CART_STORAGE_KEY)))
    setIsCartHydrated(true)
  }, [])

  useEffect(() => {
    // Sin esta guarda el primer commit escribiría el estado inicial vacío y
    // pisaría el carrito guardado antes de que el efecto de lectura lo aplique.
    if (!isCartHydrated) return

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart, isCartHydrated])

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
        setPaymentMethod,
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
