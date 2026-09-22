import { type WastePercentages } from "./calculateProductCosting.service"

export type CostingConfigSource = {
    waste_percentage_food: number
    waste_percentage_drink: number
    waste_percentage_packaging: number
}

export type CostingConfig = {
    wastePercentages: WastePercentages
}

export const resolveCostingConfig = (source: CostingConfigSource): CostingConfig => ({
    wastePercentages: {
        food: source.waste_percentage_food,
        drink: source.waste_percentage_drink,
        packaging: source.waste_percentage_packaging,
    },
})
