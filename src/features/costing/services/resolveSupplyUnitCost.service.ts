import {
    resolveComponentCost,
    type ComponentCostSource,
} from "@/features/production/services/calculateProductionCost.service"

// El costo del insumo es el precio de compra tal como está cargado: los impuestos de
// compra quedan fuera del costeo hasta que el negocio tenga un modelo impositivo claro
// (ver PLAN/02-impuestos.md). Un preparado sigue sin comprarse: su costo es el de su
// última producción (resolveComponentCost).
export const resolveSupplyUnitCost = (source: ComponentCostSource): number =>
    resolveComponentCost(source)
