import {
    resolveComponentCost,
    type ComponentCostSource,
} from "@/features/production/services/calculateProductionCost.service"
import { type TaxContext } from "@/features/taxes/types/tax.type"
import { netPurchaseAmount } from "./calculateNetAmount.service"

// El rendimiento se aplica sobre el precio ya neteado: un impuesto de compra
// recuperable vuelve como crédito fiscal y nunca fue costo. Un preparado no se
// compra, así que su costo es el de su última producción.
export const resolveSupplyUnitCost = (source: ComponentCostSource, tax: TaxContext): number =>
    resolveComponentCost({
        ...source,
        purchase_price: netPurchaseAmount(source.purchase_price, tax),
    })
