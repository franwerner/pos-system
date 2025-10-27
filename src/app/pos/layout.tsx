"use client"
import useGetConfig from "@/features/admin/hooks/useGetConfig.hook";
import { CartProvider } from "@/features/cart/context/cart-context";
import ProductFilterProvider from "@/features/products/provider/product-filter.provider";
import { Loader } from "@/shared/components/loader.component";

export default function PosLayout({ children }: { children: React.ReactNode }) {

    const { data, isLoading } = useGetConfig()

    if (isLoading) {
        return <Loader className="h-dvh" />
    } else if (!data) {
        throw new Error("No se encontro la configuracion")
    }

    return (
        <ProductFilterProvider>
            <CartProvider
                defaultPaymentMethod={data.default_payment}>
                {children}
            </CartProvider>
        </ProductFilterProvider>
    )
}