import { useQuery } from "@tanstack/react-query"
import productsData from "../data/products.data"
import { ProductFilter } from "../provider/product-filter.provider"

export default function useGetProducts(filter?: Partial<ProductFilter>) {
    return useQuery({
        queryKey: ['products', filter],
        queryFn: () => {
            return productsData
        },
    })
}   