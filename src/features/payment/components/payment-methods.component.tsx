"use client"
import { useCart } from "@/features/cart/context/cart-context";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { cn } from "@/shared/utils/cn.util";
import { useGetPayments } from "../hooks/useGetPayments.hook";


export default function PaymentMethods() {
    const { paymentMethod, setPaymentMethod } = useCart()

    const { data: payments } = useGetPayments()

    return (
        <RadioGroup value={paymentMethod?.id?.toString()} className="space-y-3">
            {payments?.map((payment) => (
                <div
                    key={payment.id}
                    onClick={() => setPaymentMethod(payment)}
                    className={cn(
                        "flex items-center justify-between rounded-xl border p-4 cursor-pointer transition",
                        paymentMethod?.id === payment.id
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-200 hover:border-gray-300"
                    )}>
                    <div className="flex items-center space-x-3">
                        <RadioGroupItem
                            value={payment.id.toString()}
                            id={`payment-${payment.id}`}
                            className={cn(
                                "h-5 w-5 border-gray-300",
                                paymentMethod?.id === payment.id && "checked:bg-emerald-500 checked:border-emerald-500"
                            )}
                        />
                        <Label htmlFor={`payment-${payment.id}`} className="font-medium cursor-pointer text-gray-700">
                            {payment.name}
                        </Label>
                    </div>
                    <span className="text-sm text-gray-500">+{payment.tax}%</span>
                </div>
            ))}
        </RadioGroup>
    );
}