import { Separator } from "@radix-ui/react-separator";
import { Check } from "lucide-react";
import { useCart } from "../../cart/context/cart-context";

export default function Ticket({ receipt_number }: { receipt_number: string }) {
    const { cart } = useCart()
    return (
        <div className="">
            <div className="mb-6 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-6 w-6 text-green-600" />
                </div>
            </div>
            <h1 className="mb-2 text-center text-2xl font-bold text-gray-800">
                Pago Exitoso
            </h1>
            <p className="mb-6 text-center text-gray-500">
                ¡Gracias por tu compra!
            </p>
            <div className="mb-6 text-center">
                <p className="font-medium">
                    Recibo #{receipt_number}
                </p>
                <p className="text-sm text-gray-400">
                    {new Date().toLocaleString()}
                </p>
            </div>
            <hr className="my-2" />
            <div className="space-y-3">
                {cart.map((item) => (
                    <div key={item.id} className="flex justify-between">
                        <div>
                            <p className="text-gray-700">
                                {item.name} × {item.quantity}
                            </p>
                        </div>
                        <p className="text-gray-700">
                            ${(item.price * item.quantity).toFixed(2)}
                        </p>
                    </div>
                ))}
            </div>
            <hr className="my-2" />
        </div>
    )
}