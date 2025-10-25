import ProductImage from "@/features/products/components/product-image.component"
import { Accordion, AccordionContent, AccordionItem } from "@/shared/components/ui/accordion"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import { Separator } from "@radix-ui/react-separator"
import clsx from "clsx"
import { ChevronDown } from "lucide-react"
import { memo, useState } from "react"
import { ProductCartItem, useCart } from "../../cart/context/cart-context"
import OrderAmount from "./order-amount.component"

export const ProductSummaryItem = memo(({ item }: { item: ProductCartItem }) => {
    return (
        <div
            className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0"
            key={item.id}>
            <div className="flex items-center gap-3">
                <ProductImage
                    src={item.img_url}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 object-cover rounded-md border"
                />
                <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-500">
                        {formatCurrency(item.price)} × {item.quantity}
                    </p>
                </div>
            </div>
            <p className="font-semibold text-gray-900">
                {formatCurrency(item.price * item.quantity)}
            </p>
        </div>
    )
})

const ProductsSummary = () => {
    const { cart } = useCart()
    const [open, setOpen] = useState(false)

    const MAX_VIEW = 3

    return (
        <Accordion
            type="single"
            value={open ? "more" : ""}
            collapsible>
            {cart.slice(0, MAX_VIEW).map((item) => (
                <div key={item.id}>
                    <ProductSummaryItem item={item} />
                </div>
            ))}
            {cart.length > MAX_VIEW && (
                <AccordionItem
                    key="more"
                    value="more"
                >
                    <AccordionContent>
                        {cart.slice(MAX_VIEW).map((item) => (
                            <ProductSummaryItem item={item} key={item.id} />
                        ))}
                    </AccordionContent>
                </AccordionItem>
            )}
            {cart.length > MAX_VIEW && (
                <div
                    className="mt-2 flex items-center justify-between cursor-pointer select-none rounded-md px-3 py-1 hover:bg-gray-100 transition"
                    onClick={() => setOpen(!open)}
                >
                    <span className="text-sm font-medium text-gray-700">
                        {open
                            ? "Ver menos"
                            : (
                                <>
                                    Ver <span className="font-bold">{cart.length - MAX_VIEW}</span> productos más
                                </>
                            )
                        }
                    </span>
                    <ChevronDown
                        className={clsx(
                            "h-4 w-4 text-gray-500 transition-transform duration-200",
                            open ? "rotate-180" : ""
                        )}
                    />
                </div>
            )}
        </Accordion>
    );
}

export default function OrderSummary() {

    return (
        <div className="bg-white rounded-xl border shadow-sm p-5">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Resumen del Pedido
            </h2>

            <div className="flex flex-col gap-2">
                <ProductsSummary />
            </div>
            <Separator className="my-4" />
            <div className="flex flex-col gap-2 p-4">
                <h2 className="text-lg font-semibold text-gray-800">
                    Resumen del Pedido
                </h2>
                <OrderAmount />
            </div>
        </div>
    )
}