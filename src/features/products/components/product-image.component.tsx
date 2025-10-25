"use client"

import { cn } from "@/shared/utils/cn.util"
import Image, { ImageProps } from "next/image"
import { useState } from "react"

export default function ProductImage({ src, ...props }: Omit<ImageProps, "src"> & { src?: string | null }) {

    const [imgUrl, setImgUrl] = useState(src || "/placeholder.svg")
    return (
        <Image
            src={imgUrl}
            {...props}
            className={cn("object-cover", props.className)}
            onError={() => {
                setImgUrl("/placeholder.svg")
            }}
        />
    )
}