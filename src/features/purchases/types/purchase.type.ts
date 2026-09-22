import { type SupplyUnit } from "@/features/supplies/types/supply.type"
import { type Tables } from "@/shared/types/database.types"

export type Purchase = Tables<"purchase">
export type PurchaseItem = Tables<"purchase_item">

export type PurchaseItemWithSupply = PurchaseItem & {
    supply: { name: string; unit: SupplyUnit } | null
}

export type PurchaseWithItems = Purchase & {
    purchase_item: PurchaseItemWithSupply[]
}

export type PurchaseLineInput = {
    supply_id: number
    quantity: number
    unit_price: number
}

export type PurchaseInput = {
    supplier_name: string | null
    purchased_at: string
    note: string | null
    lines: PurchaseLineInput[]
}
