import CartSidebar from "@/features/cart/components/cart-sidebar.component";
import CategorySidebar from "@/features/products/components/category-sidebar.component";
import ProductGrid from "@/features/products/components/product-grid.component";
import SearchProduct from "@/features/products/components/search-product.component";
import { useState } from "react";

export default function POSView() {
    const [selectedCategory, setSelectedCategory] = useState("all")
    return (
        <div className="flex h-screen bg-background">
            <CategorySidebar selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <div className="sticky top-0 z-10 bg-background p-4 border-b">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Punto de venta</h1>
                        <SearchProduct className="w-60" />
                    </div>
                </div>
                <ProductGrid />
            </main>
            <CartSidebar />
        </div>
    )
}