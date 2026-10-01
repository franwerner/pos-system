"use client"

import { useEffect, useState } from "react"
import useGetCostingContext from "@/features/costing/hooks/useGetCostingContext.hook"
import { calculateProductCosting } from "@/features/costing/services/calculateProductCosting.service"
import { resolveSupplyUnitCost } from "@/features/costing/services/resolveSupplyUnitCost.service"
import { type CostingSupplyLine } from "@/features/costing/types/costing.type"
import { isPreparedWithoutCost } from "@/features/supplies/services/isPreparedWithoutCost.service"
import { type CompositionLineInput } from "@/features/supplies/types/composition.type"
import {
    SUPPLY_TYPES,
    SUPPLY_TYPE_LABELS,
    type SupplyWithCost,
} from "@/features/supplies/types/supply.type"
import { CostingCard, type CostingCardProps, type CostingDetailLine } from "@/shared/components/costing-card.component"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import formatPercentage from "@/shared/utils/formatPercentage.util"

interface ProductCostingPreviewProps {
    lines: CompositionLineInput[]
    price: number
    /** `null` es un producto sin margen objetivo: no hay precio sugerido. */
    targetMarginPercentage: number | null
    supplies: SupplyWithCost[]
    /** "row" = tarjeta de 3 columnas (escritorio); "stacked" = apilada (celular). */
    layout?: "row" | "stacked"
    /** Id único del switch "Ver detalle": la tarjeta se renderiza dos veces (una por breakpoint). */
    switchId?: string
}

const SHOW_DETAIL_STORAGE_KEY = "admin-products.costing-show-detail"

// Es una preferencia de quién mira la pantalla (dueño vs. quien solo fija el precio), no
// un dato del producto: se recuerda por navegador, nunca por producto ni en el servidor.
const readStoredShowDetail = (): boolean => {
    try {
        return window.localStorage.getItem(SHOW_DETAIL_STORAGE_KEY) === "true"
    } catch {
        return false
    }
}

const writeStoredShowDetail = (value: boolean) => {
    try {
        window.localStorage.setItem(SHOW_DETAIL_STORAGE_KEY, String(value))
    } catch {
        // Sin localStorage disponible (privado/bloqueado) el switch no se recuerda: no rompe nada.
    }
}

/**
 * Contenedor: calcula el costeo con los servicios reales y le pasa los props ya resueltos
 * a `CostingCard` (presentacional, no calcula nada). PLAN-UI/vistas/admin-products.md.
 */
export default function ProductCostingPreview({
    lines,
    price,
    targetMarginPercentage,
    supplies,
    layout = "row",
    switchId,
}: ProductCostingPreviewProps) {
    // Arranca apagado (vista local) para que el primer render del servidor y del cliente
    // coincidan; la preferencia guardada en este navegador se aplica apenas monta.
    const [showDetail, setShowDetail] = useState(false)

    useEffect(() => {
        setShowDetail(readStoredShowDetail())
    }, [])

    const handleShowDetailChange = (value: boolean) => {
        setShowDetail(value)
        writeStoredShowDetail(value)
    }

    const { data: context } = useGetCostingContext()

    if (!context) return null

    const { waste_percentages: wastePercentages } = context

    // Mientras el usuario carga la composición hay líneas a medio escribir: solo se
    // costean las que ya tienen insumo y cantidad.
    const validLines = lines.reduce<{ line: CostingSupplyLine; supply: SupplyWithCost }[]>((valid, line) => {
        const supply = supplies.find((item) => item.id === line.supply_id)

        if (!supply || !Number.isFinite(line.quantity) || line.quantity <= 0) return valid

        return [...valid, {
            supply,
            line: {
                supply_id: supply.id,
                name: supply.name,
                type: supply.type,
                unit: supply.unit,
                quantity: line.quantity,
                unit_cost: resolveSupplyUnitCost(supply),
            },
        }]
    }, [])

    const costing = calculateProductCosting(validLines.map(({ line }) => line), {
        price: Number.isFinite(price) && price >= 0 ? price : 0,
        wastePercentages,
        targetMarginPercentage,
    })

    if (!costing) {
        return (
            <CostingCard
                state="uncosted"
                showDetail={showDetail}
                onShowDetailChange={handleShowDetailChange}
                layout={layout}
                switchId={switchId}
            />
        )
    }

    // Un preparado que nunca se produjo suma $0 en silencio (resolveComponentCost): se
    // avisa con el primero que aparezca en la receta.
    const preparedWithoutCost = validLines.find(({ supply }) => isPreparedWithoutCost(supply))?.supply.name

    const detailLines: CostingDetailLine[] = costing.lines.map((costedLine) => {
        const supply = validLines.find(({ supply: s }) => s.id === costedLine.supply_id)!.supply

        return {
            supply: costedLine.name,
            quantityLabel: `${costedLine.quantity} ${costedLine.unit} · ${SUPPLY_TYPE_LABELS[costedLine.type]}`,
            unitCostLabel: `${formatCurrency(costedLine.unit_cost)}/${costedLine.unit}`,
            losses: costedLine.waste_cost,
            contribution: costedLine.total_cost,
            isPrepared: supply.origin === "produced",
        }
    })

    const lossesByType = SUPPLY_TYPES.map((type) => ({
        label: `${SUPPLY_TYPE_LABELS[type]} (${formatPercentage(wastePercentages[type])})`,
        amount: costing.lines
            .filter((costedLine) => costedLine.type === type)
            .reduce((total, costedLine) => total + costedLine.waste_cost, 0),
    }))

    const priceBelowSuggested = costing.suggested_price !== null && costing.price < costing.suggested_price

    const costingProps: CostingCardProps = {
        state: "costed",
        costToMake: costing.variable_cost,
        leftPerDish: costing.contribution_margin,
        suggestedPrice: costing.suggested_price,
        targetMargin: costing.target_margin_percentage ?? undefined,
        currentPrice: costing.price,
        priceBelowSuggested,
        showDetail,
        onShowDetailChange: handleShowDetailChange,
        preparedWithoutCost,
        layout,
        switchId,
        detail: {
            lines: detailLines,
            suppliesTotal: costing.supplies_cost,
            lossesTotal: costing.waste_cost,
            lossesByType,
        },
    }

    return <CostingCard {...costingProps} />
}
