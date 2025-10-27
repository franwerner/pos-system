import CartSidebar from "@/features/cart/components/cart-sidebar.component";
import CategorySidebar from "@/features/products/components/category-sidebar.component";
import ProductGrid from "@/features/products/components/product-grid.component";
import SearchProduct from "@/features/products/components/search-product.component";
import { SidebarTrigger } from "@/shared/components/ui/sidebar";



export default function POSView() {
    return (
        <div className="flex w-full h-screen bg-background">
            <CategorySidebar />
            <main className="flex-1 w-full flex flex-col h-screen overflow-hidden">

                <div className="flex flex-col xl:flex-row py-4 pl-4 xl:pl-0 pr-4 gap-2 items-center justify-between border-b">
                    <div className="flex justify-start items-center w-full">
                        <SidebarTrigger className="p-0 cursor-pointer" />
                        <h1 className="text-2xl font-bold self-center">Punto de venta</h1>
                    </div>
                    <SearchProduct className="w-full xl:w-90" />
                </div>
                <ProductGrid />
            </main>
            <CartSidebar />
        </div>
    )
}