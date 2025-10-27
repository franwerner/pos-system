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
        <Empty className="bg-white h-full w-full p-8 rounded-xl">
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
    )
}

export default EmptyCart