import { type SupplyOrigin } from "@/features/supplies/types/supply.type"
import { calculateSupplyCost } from "@/features/supplies/services/calculateSupplyCost.service"

export type ProductionComponentLine = {
    supply_id: number
    quantity: number
    unit_cost: number
}

export type ProductionConsumption = {
    supply_id: number
    quantity: number
    unit_cost: number
}

export type ComponentCostSource = {
    origin: SupplyOrigin
    purchase_price: number
    yield_factor: number
    last_production_unit_cost: number | null
}

const assertProducedQuantity = (producedQuantity: number) => {
    if (!Number.isFinite(producedQuantity) || producedQuantity <= 0) {
        throw new Error("La cantidad producida debe ser un número mayor a 0")
    }
}

const assertComponent = ({ quantity, unit_cost }: ProductionComponentLine) => {
    if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("La cantidad del componente debe ser un número mayor a 0")
    }

    if (!Number.isFinite(unit_cost) || unit_cost < 0) {
        throw new Error("El costo del componente debe ser un número mayor o igual a 0")
    }
}

// Un preparado no tiene precio de compra: su costo es el que dejó la última
// producción, y vale 0 mientras no se haya producido nunca.
export const resolveComponentCost = ({
    origin,
    purchase_price,
    yield_factor,
    last_production_unit_cost,
}: ComponentCostSource): number =>
    origin === "produced"
        ? last_production_unit_cost ?? 0
        : calculateSupplyCost(purchase_price, yield_factor)

export const calculateProductionConsumption = (
    components: ProductionComponentLine[],
    producedQuantity: number,
): ProductionConsumption[] => {
    assertProducedQuantity(producedQuantity)

    return components.map((component) => {
        assertComponent(component)

        return {
            supply_id: component.supply_id,
            quantity: -component.quantity * producedQuantity,
            unit_cost: component.unit_cost,
        }
    })
}

export const calculateProductionCost = (
    components: ProductionComponentLine[],
    producedQuantity: number,
): number =>
    calculateProductionConsumption(components, producedQuantity)
        .reduce((total, item) => total + -item.quantity * item.unit_cost, 0)

export const calculateProductionUnitCost = (
    components: ProductionComponentLine[],
    producedQuantity: number,
): number => calculateProductionCost(components, producedQuantity) / producedQuantity
