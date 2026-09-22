"use client"

import Image, { type ImageProps } from "next/image"
import { ImageOff } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/shared/utils/cn.util"

type ProductImageProps = Omit<ImageProps, "src"> & { src?: string | null }

export default function ProductImage({ src, ...props }: ProductImageProps) {
    const [hasFailed, setHasFailed] = useState(false)

    // El mismo nodo se reusa cuando la grilla se filtra: sin reiniciar la marca,
    // una URL rota dejaría sin imagen al producto que ocupe su lugar.
    useEffect(() => {
        setHasFailed(false)
    }, [src])

    const { fill, className, alt, width, height, ...rest } = props

    if (!src || hasFailed) {
        return (
            <div
                role="img"
                aria-label={alt}
                className={cn(
                    "flex items-center justify-center bg-muted text-muted-foreground",
                    fill && "absolute inset-0",
                    className,
                )}
            >
                <ImageOff className="size-1/4 max-h-10 min-h-4 max-w-10 min-w-4 opacity-50" />
            </div>
        )
    }

    return (
        <Image
            src={src}
            alt={alt}
            fill={fill}
            width={width}
            height={height}
            {...rest}
            className={cn("object-cover", className)}
            onError={() => setHasFailed(true)}
        />
    )
}
