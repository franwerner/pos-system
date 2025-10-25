import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/shared/components/ui/empty";
import { ShoppingCartIcon } from "lucide-react";

const EmptyCart = ({ content }: { content?: React.ReactNode }) => {
    return (
        <div className="flex h-full items-center justify-center bg-gray-50">
            <Empty className="bg-white p-8 rounded-xl">
                <EmptyHeader>
                    <EmptyMedia>
                        <ShoppingCartIcon strokeWidth={1} size={42} />
                    </EmptyMedia>
                    <EmptyTitle>Carrito vacío</EmptyTitle>
                    <EmptyDescription>
                        Agrega productos a tu carrito antes seguir
                    </EmptyDescription>
                </EmptyHeader>

                <EmptyContent>
                    {content}
                </EmptyContent>
            </Empty>
        </div>
    )
}

export default EmptyCart