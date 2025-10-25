"use client"
import { Card, CardContent } from "@/shared/components/ui/card";
import { PlusCircle } from "lucide-react";
import { type Product } from "../types/product.type";
import formatCurrency from "@/shared/utils/formatCurrency.util";
import { memo } from "react";
import ProductImage from "./product-image.component";

interface ProductProps {
    product: Product
    addToCart: (product: Product) => void
}

const ProductCard = memo(({ product, addToCart }: ProductProps) => {

    return (
        <Card
            key={product.id}
            className="overflow-hidden transition-all scale-95 duration-200 hover:scale-100 hover:shadow-md cursor-pointer group"
            onClick={() => addToCart(product)}>
            <div className="relative aspect-square">
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 z-10">
                    <PlusCircle className="h-10 w-10 text-white" />
                </div>
                <ProductImage
                    fill
                    src={product.img_url || "/placeholder.svg"}
                    alt={product.name}
                    className="object-cover" />
            </div>
            <CardContent className="p-3">
                <div>
                    <h3 className="font-medium line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{formatCurrency(product.price)}</p>
                </div>
            </CardContent>
        </Card>
    )
})

export default ProductCard