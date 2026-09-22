"use client"

import useGetCostingContext from "@/features/costing/hooks/useGetCostingContext.hook"
import { calculateProductCosting } from "@/features/costing/services/calculateProductCosting.service"
import { describeConfidence } from "@/features/costing/services/describeConfidence.service"
import { resolveSupplyUnitCost } from "@/features/costing/services/resolveSupplyUnitCost.service"
import { type CostingSupplyLine } from "@/features/costing/types/costing.type"
import { type CompositionLineInput } from "@/features/supplies/types/composition.type"
import { SUPPLY_TYPE_LABELS, type SupplyWithCost } from "@/features/supplies/types/supply.type"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table"
import { cn } from "@/shared/utils/cn.util"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import formatPercentage from "@/shared/utils/formatPercentage.util"
import SuggestedPrice from "./suggested-price.component"

interface ProductCostingPreviewProps {
    lines: CompositionLineInput[]
    price: number
    /** `null` es un producto sin margen objetivo: no hay precio sugerido. */
    targetMarginPercentage: number | null
    supplies: SupplyWithCost[]
}

export default function ProductCostingPreview({
    lines,
    price,
    targetMarginPercentage,
    supplies,
}: ProductCostingPreviewProps) {
    const { data: context } = useGetCostingContext()

    if (!context) return null

    const { tax, waste_percentages: wastePercentages, fixed_cost_per_unit: fixedCostPerUnit } = context
    const saleDeductionRate = tax.sale_rate + tax.payment_rate

    // Mientras el usuario carga la composición hay líneas a medio escribir: solo
    // se costean las que ya tienen insumo y cantidad.
    const costingLines = lines.reduce<CostingSupplyLine[]>((valid, line) => {
        const supply = supplies.find((item) => item.id === line.supply_id)

        if (!supply || !Number.isFinite(line.quantity) || line.quantity <= 0) return valid

        return [...valid, {
            supply_id: supply.id,
            name: supply.name,
            type: supply.type,
            unit: supply.unit,
            quantity: line.quantity,
            unit_cost: resolveSupplyUnitCost({
                origin: supply.origin,
                purchase_price: supply.purchase_price,
                yield_factor: supply.yield_factor,
                last_production_unit_cost: supply.last_production_unit_cost,
            }, tax),
        }]
    }, [])

    const costing = calculateProductCosting(costingLines, {
        price: Number.isFinite(price) && price >= 0 ? price : 0,
        wastePercentages,
        fixedCostPerUnit: fixedCostPerUnit.amount_per_unit,
        targetMarginPercentage,
        tax,
    })

    if (!costing) {
        return (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                Cargá insumos con su cantidad para ver el costo y el margen de este producto.
            </p>
        )
    }

    return (
        <div className="flex flex-col gap-3 rounded-lg border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <p className="text-sm font-medium">Costo y margen en vivo</p>
                    <p className="text-xs text-muted-foreground">
                        {targetMarginPercentage === null
                            ? "Cargá el margen objetivo de este producto para ver un precio sugerido"
                            : `Precio sugerido para un ${formatPercentage(targetMarginPercentage)} de margen`}
                    </p>
                </div>
                {costing.suggested_price !== null && costing.suggested_price_difference !== null && (
                    <SuggestedPrice
                        suggestedPrice={costing.suggested_price}
                        difference={costing.suggested_price_difference}
                        confidence={fixedCostPerUnit.confidence}
                    />
                )}
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Insumo</TableHead>
                        <TableHead className="text-right">Costo unitario</TableHead>
                        <TableHead className="text-right">Pérdidas</TableHead>
                        <TableHead className="text-right">Aporte al costo</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {costing.lines.map((line) => (
                        <TableRow key={line.supply_id}>
                            <TableCell>
                                <span className="font-medium">{line.name}</span>
                                <span className="block text-xs text-muted-foreground">
                                    {line.quantity} {line.unit} · {SUPPLY_TYPE_LABELS[line.type]}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                {formatCurrency(line.unit_cost)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                                {formatCurrency(line.waste_cost)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {formatCurrency(line.total_cost)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <dl className="grid gap-2 border-t pt-3 text-sm">
                <div className="flex justify-between font-medium">
                    <dt>Costo variable</dt>
                    <dd>{formatCurrency(costing.variable_cost)}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-muted-foreground">Costo fijo por unidad</dt>
                    <dd>{formatCurrency(costing.fixed_cost_amount)}</dd>
                </div>
                <div className="flex justify-between font-medium">
                    <dt>Costo total</dt>
                    <dd>{formatCurrency(costing.total_cost)}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                        {saleDeductionRate > 0
                            ? `Precio neto (después del ${formatPercentage(saleDeductionRate)} que se va en impuestos y comisiones)`
                            : "Precio de venta"}
                    </dt>
                    <dd>{formatCurrency(costing.net_price)}</dd>
                </div>
                <div
                    className={cn(
                        "flex justify-between border-t pt-2",
                        costing.contribution_margin < 0 && "text-destructive",
                    )}>
                    <dt>Margen de contribución (sobre el costo variable)</dt>
                    <dd>
                        {formatCurrency(costing.contribution_margin)}
                        {" · "}
                        {formatPercentage(costing.contribution_margin_percentage)}
                    </dd>
                </div>
                {costing.profit_tax_amount > 0 && (
                    <div className="flex justify-between">
                        <dt className="text-muted-foreground">
                            Impuestos sobre la ganancia ({formatPercentage(tax.profit_rate)})
                        </dt>
                        <dd>−{formatCurrency(costing.profit_tax_amount)}</dd>
                    </div>
                )}
                <div
                    className={cn(
                        "flex justify-between font-semibold",
                        costing.net_margin < 0 && "text-destructive",
                    )}>
                    <dt>Margen neto (sobre el costo total)</dt>
                    <dd>
                        {formatCurrency(costing.net_margin)}
                        {" · "}
                        {formatPercentage(costing.net_margin_percentage)}
                    </dd>
                </div>
            </dl>

            <p className="text-xs text-muted-foreground">
                {describeConfidence(fixedCostPerUnit)}
            </p>
        </div>
    )
}
