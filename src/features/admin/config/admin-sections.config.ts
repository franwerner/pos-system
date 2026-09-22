import {
    Boxes,
    CreditCard,
    ChefHat,
    Landmark,
    Package,
    Receipt,
    Settings,
    ShoppingCart,
    Utensils,
    Wallet,
    type LucideIcon,
} from "lucide-react"

export type AdminSection = {
    href: string
    label: string
    description: string
    icon: LucideIcon
    isAvailable: boolean
}

export const ADMIN_SECTIONS: AdminSection[] = [
    {
        href: "/admin/products",
        label: "Productos",
        description: "Lo que se vende y la composición que descuenta stock.",
        icon: Utensils,
        isAvailable: true,
    },
    {
        href: "/admin/supplies",
        label: "Insumos",
        description: "Ingredientes, packaging y bebidas: todo lo que lleva stock.",
        icon: Package,
        isAvailable: true,
    },
    {
        href: "/admin/stock",
        label: "Stock",
        description: "Existencias por insumo y alertas de stock mínimo.",
        icon: Boxes,
        isAvailable: true,
    },
    {
        href: "/admin/purchases",
        label: "Compras",
        description: "Ingreso de mercadería y actualización de precios.",
        icon: ShoppingCart,
        isAvailable: true,
    },
    {
        href: "/admin/production",
        label: "Producción",
        description: "Preparados: consumo de componentes y costo unitario.",
        icon: ChefHat,
        isAvailable: true,
    },
    {
        href: "/admin/fixed-costs",
        label: "Costos fijos",
        description: "Gastos mensuales que se reparten por unidad vendida.",
        icon: Receipt,
        isAvailable: true,
    },
    {
        href: "/admin/taxes",
        label: "Impuestos",
        description: "Qué impuesto entra en cada paso del costeo y con qué tasa.",
        icon: Landmark,
        isAvailable: true,
    },
    {
        href: "/admin/payment-methods",
        label: "Tarifas",
        description: "Métodos de pago y el ajuste de cada uno: negativo es descuento.",
        icon: CreditCard,
        isAvailable: true,
    },
    {
        href: "/admin/settings",
        label: "Configuración",
        description: "Pérdidas por tipo de insumo.",
        icon: Settings,
        isAvailable: true,
    },
    {
        href: "/admin/cash",
        label: "Caja",
        description: "Apertura, cierre y arqueo de caja.",
        icon: Wallet,
        isAvailable: true,
    },
]
