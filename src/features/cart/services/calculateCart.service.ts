import { Payment } from "@/features/payment/types/payment.type";
import { ProductCartItem } from "../context/cart-context";

export const calculateCart = (cart: ProductCartItem[], paymentMethod: Payment) => {
    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
    const itemCount = cart.reduce((count, item) => count + item.quantity, 0)
    const taxAmount = cartTotal * (paymentMethod.tax / 100)
    const subTotal = cartTotal
    const total = cartTotal + taxAmount
    return { subTotal, taxAmount, total, itemCount }
}
