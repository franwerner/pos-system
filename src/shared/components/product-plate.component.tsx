import type { LucideIcon } from "lucide-react"
import { ImageIcon } from "lucide-react"
import { cn } from "@/shared/utils/cn.util"

export type PlateTone = "accent" | "warning" | "success" | "info" | "muted"

const toneClass: Record<PlateTone, string> = {
    accent: "bg-accent text-accent-foreground",
    warning: "bg-warning-muted text-warning-muted-foreground",
    success: "bg-success-muted text-success-muted-foreground",
    info: "bg-info-muted text-info-muted-foreground",
    muted: "bg-muted text-muted-foreground",
}

const sizeClass = {
    lg: { box: "size-[92px] border-[6px]", icon: "size-10" },
    md: { box: "size-[52px] border-[3px]", icon: "size-6" },
    sm: { box: "size-11 border-[3px]", icon: "size-5" },
}

export interface ProductPlateProps {
    /** URL de la foto del producto. Si no hay, se muestra el ícono. */
    imageUrl?: string
    /** Ícono de la categoría (Hamburguesa → Sandwich, bebidas → CupSoda, etc.). Sin ícono: ImageIcon. */
    icon?: LucideIcon
    tone?: PlateTone
    size?: keyof typeof sizeClass
    alt?: string
}

/**
 * Imagen redonda de producto, tipo plato (POS, carrito, resumen del pedido, ticket). Sin foto:
 * plato de color con el ícono de la categoría; distinto de `ProductImage` (rectangular, sin
 * fallback por categoría) que usa hoy `/admin/products`.
 */
export function ProductPlate({ imageUrl, icon: Icon = ImageIcon, tone = "muted", size = "lg", alt = "" }: ProductPlateProps) {
    const s = sizeClass[size]
    return (
        <div
            className={cn(
                "flex shrink-0 items-center justify-center overflow-hidden rounded-full border-card ring-1 ring-border",
                s.box,
                !imageUrl && toneClass[tone],
            )}
        >
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- foto de usuario, no sirve de next/image sin ancho fijo del origen
                <img src={imageUrl} alt={alt} className="size-full object-cover" />
            ) : (
                <Icon className={s.icon} aria-hidden />
            )}
        </div>
    )
}
