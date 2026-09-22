import LogoutButton from "@/features/auth/components/logout-button.component";
import CartSidebar from "@/features/cart/components/cart-sidebar.component";
import CashSessionStatus from "@/features/cash/components/cash-session-status.component";
import PendingOrdersButton from "@/features/order/components/pending-orders-button.component";
import CategorySidebar from "@/features/products/components/category-sidebar.component";
import ProductGrid from "@/features/products/components/product-grid.component";
import SearchProduct from "@/features/products/components/search-product.component";
import { SidebarProvider, SidebarTrigger } from "@/shared/components/ui/sidebar";


export default function POSView() {
    return (
        <SidebarProvider>
            <div className="flex w-full h-screen bg-background">
                <CategorySidebar />
                <main className="flex-1 w-full flex flex-col h-screen overflow-hidden">

                    <div className="flex flex-col 2xl:flex-row py-4 pl-4 2xl:pl-0 pr-4 gap-2 items-center justify-between border-b">
                        <div className="flex justify-start items-center w-full min-w-0">
                            <SidebarTrigger className="p-0 cursor-pointer" />
                            <h1 className="text-2xl font-bold self-center whitespace-nowrap">Punto de venta</h1>
                            <div className="ml-4">
                                <CashSessionStatus />
                            </div>
                        </div>
                        <div className="flex w-full 2xl:w-auto shrink-0 items-center gap-2">
                            <SearchProduct className="w-full 2xl:w-90" />
                            <PendingOrdersButton />
                            <LogoutButton />
                        </div>
                    </div>
                    <ProductGrid />
                </main>
                <CartSidebar />
            </div>
        </SidebarProvider>
    )
}