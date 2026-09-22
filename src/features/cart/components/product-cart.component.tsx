"use client"
import ProductImage from "@/features/products/components/product-image.component";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import formatCurrency from "@/shared/utils/formatCurrency.util";
import { Minus, Plus, Trash2 } from "lucide-react";
import { memo } from "react";
import { ProductCartItem } from "../context/cart-context";

interface Props {
    item: ProductCartItem
    updateQuantity: (id: number, quantity: number) => void
    removeFromCart: (id: number) => void,
}

interface FooterProps {
    quantity: number
    onIncrease: () => void
    onDecrease: () => void
    onRemove: () => void
}

const ProductCartFooter = ({ quantity, onIncrease, onDecrease, onRemove }: FooterProps) => {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 cursor-pointer p-0 transition-transform active:scale-90"
                    onClick={onDecrease}
                >
                    <Minus className="h-3 w-3" />
                </Button>

                <span className="w-8 text-center font-medium">{quantity}</span>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 cursor-pointer p-0 transition-transform active:scale-90"
                    onClick={onIncrease}
                >
                    <Plus className="h-3 w-3" />
                </Button>
            </div>

            <Button
                variant="link"
                size="icon"
                className="h-7 w-7 bg-red-100 hover:bg-red-500 hover:text-red-100 cursor-pointer text-red-500"
                onClick={onRemove}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    )
}

const ProductItemCart = memo(({ item, updateQuantity, removeFromCart }: Props) => {
    const eachPrice = item.price
    const totalPrice = item.price * item.quantity
    return (
        <div className="flex gap-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center overflow-hidden rounded-md border ">
                <ProductImage
                    src={item.img_url}
                    alt={item.name}
                    width={100}
                    height={100}
                    className="h-full w-16 object-cover"
                />
            </div>
            <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-1 items-start">
                    <Tooltip >
                        <TooltipTrigger className="w-full flex justify-start">
                            <h3 className=" line-clamp-1 text-start text-sm text-gray-800">{item.name}</h3>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-sm">{item.name}</p>
                        </TooltipContent>
                    </Tooltip>
                    <p className="font-semibold text-sm text-gray-900">{formatCurrency(totalPrice)}</p>
                </div>
                <p className="my-1 text-sm text-gray-500">
                    {formatCurrency(eachPrice)}
                </p>
                <ProductCartFooter
                    quantity={item.quantity}
                    onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                    onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
                    onRemove={() => removeFromCart(item.id)}
                />
            </div>
        </div>
    )
})

export default ProductItemCart