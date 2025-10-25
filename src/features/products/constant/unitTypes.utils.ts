import { UnitEnum } from "../types/UniteEnum.type"

const unitTypes: Record<UnitEnum, { name: string }> = {
    "u": {
        name: "Unidad",
    },
    "gr": {
        name: "Gramo",
    },
    "lt": {
        name: "Litro",
    },
}

export default unitTypes

