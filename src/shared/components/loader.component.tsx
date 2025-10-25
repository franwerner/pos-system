import { Spinner } from "@/shared/components/ui/spinner"
import { cn } from "../utils/cn.util"

export const Loader = ({ className }: { className?: string }) => {
    return (
        <div className={cn(
            "flex items-center bg-black/5 flex-1 h-full justify-center",
            className
        )}>
            <Spinner />
        </div>
    )
}