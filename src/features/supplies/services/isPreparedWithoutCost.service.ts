import { type SupplyOrigin } from "../types/supply.type"

export type PreparedCostSource = {
    origin: SupplyOrigin
    last_production_unit_cost: number | null
}

// Un preparado que nunca se produjo aporta costo $0 a cualquier receta que lo use, y
// hoy lo hace en silencio (resolveComponentCost devuelve 0 sin avisar). Esto separa esa
// detección del cálculo del costeo, para que la UI pueda mostrar el aviso sin tocar el
// motor de costeo (PLAN-UI/vistas/admin-products.md).
export const isPreparedWithoutCost = ({ origin, last_production_unit_cost }: PreparedCostSource): boolean =>
    origin === "produced" && last_production_unit_cost === null
