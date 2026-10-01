"use client"

import { Layers, TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import { Label } from "@/shared/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table"
import formatCurrency from "@/shared/utils/formatCurrency.util"
import { type ProductionComponent } from "../types/production.type"

// Cantidades no son moneda: mismo criterio que el resto del admin (`formatQuantity`
// en `stock-table.component.tsx` / `purchase-detail-dialog.component.tsx`).
const formatQuantity = (value: number) => new Intl.NumberFormat("es-AR").format(value)

const Dash = () => <span className="text-muted-foreground">—</span>

function NoPriorBadge() {
    return (
        <span className="h-5 rounded-full bg-warning-muted px-2 text-xs font-semibold text-warning-muted-foreground">
            Sin producción previa
        </span>
    )
}

function WarningAlert({ title, description, role }: { title: string; description: string; role: "alert" | "status" }) {
    return (
        <Alert role={role} className="border-transparent bg-warning-muted text-warning-muted-foreground">
            <TriangleAlert className="size-5" aria-hidden />
            <AlertTitle className="text-[15px] font-bold">{title}</AlertTitle>
            <AlertDescription className="text-sm text-warning-muted-foreground">{description}</AlertDescription>
        </Alert>
    )
}

interface ProductionComponentsPreviewProps {
    /** false = todavía no se elige un preparado. */
    supplySelected: boolean
    supplyName?: string
    /** Unidad del preparado que se produce (no la de sus componentes), ej. "u". */
    supplyUnit?: string
    components: ProductionComponent[]
    producedQuantity: number
}

type Row = ProductionComponent & { noPriorProduction: boolean }

/** Vista previa con marco de color: "esto es lo que se va a consumir", no otra tabla más. */
function PreviewTable({ heading, rows, producedQuantity }: { heading: string; rows: Row[]; producedQuantity: number }) {
    return (
        <div className="overflow-hidden rounded-[14px] border-[1.5px] border-brand bg-card">
            <div className="flex items-center gap-2.5 bg-accent px-3.5 py-2.5 text-accent-foreground sm:px-4">
                <Layers className="size-4" aria-hidden />
                <span className="text-sm font-semibold">
                    <span className="sm:hidden">Esto se va a consumir</span>
                    <span className="hidden sm:inline">{heading}</span>
                </span>
            </div>
            {/* Escritorio */}
            <Table className="hidden text-sm sm:table">
                <TableHeader>
                    <TableRow>
                        <TableHead className="pl-4 text-[13px] font-semibold text-muted-foreground">Componente</TableHead>
                        <TableHead className="text-right text-[13px] font-semibold text-muted-foreground">Por unidad</TableHead>
                        <TableHead className="text-right text-[13px] font-semibold text-muted-foreground">A consumir</TableHead>
                        <TableHead className="text-right text-[13px] font-semibold text-muted-foreground">Costo unitario</TableHead>
                        <TableHead className="pr-4 text-right text-[13px] font-semibold text-muted-foreground">Importe</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((r) => {
                        const toConsume = producedQuantity > 0 ? r.quantity * producedQuantity : null
                        const amount = producedQuantity > 0 ? toConsume! * r.unit_cost : null

                        return (
                            <TableRow key={r.supply_id}>
                                <TableCell className="py-2 pl-4">
                                    <span className="font-semibold">{r.name}</span>{" "}
                                    {r.noPriorProduction && <NoPriorBadge />}
                                </TableCell>
                                <TableCell className="py-2 text-right tabular-nums">
                                    {formatQuantity(r.quantity)} {r.unit}
                                </TableCell>
                                <TableCell className="py-2 text-right font-semibold tabular-nums">
                                    {toConsume === null ? <Dash /> : `${formatQuantity(toConsume)} ${r.unit}`}
                                </TableCell>
                                <TableCell className="py-2 text-right tabular-nums">
                                    {formatCurrency(r.unit_cost)}/{r.unit}
                                </TableCell>
                                <TableCell className="py-2 pr-4 text-right tabular-nums">
                                    {amount === null ? <Dash /> : formatCurrency(amount)}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
            {/* Celular */}
            <div className="px-3.5 sm:hidden">
                {rows.map((r) => {
                    const toConsume = producedQuantity > 0 ? r.quantity * producedQuantity : null
                    const amount = producedQuantity > 0 ? toConsume! * r.unit_cost : null

                    return (
                        <div key={r.supply_id} className="flex items-start justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
                            <div className="flex flex-col gap-0.5">
                                <span className="font-semibold">{r.name}</span>
                                {r.noPriorProduction && <span><NoPriorBadge /></span>}
                                <span className="text-[13px] tabular-nums text-muted-foreground">
                                    {formatQuantity(r.quantity)} {r.unit} por unidad · {formatCurrency(r.unit_cost)}/{r.unit}
                                </span>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                                <span className="font-semibold tabular-nums">
                                    {toConsume === null ? <Dash /> : `${formatQuantity(toConsume)} ${r.unit}`}
                                </span>
                                <span className="text-[13px] tabular-nums text-muted-foreground">
                                    {amount === null ? "—" : formatCurrency(amount)}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/**
 * Vista previa de los componentes de la receta: orientativa (al guardar el servidor vuelve a
 * leer la receta vigente). `noComponents` no ocurre hoy vía UI normal porque el selector ya
 * filtra server-side los preparados sin componentes, pero se replica por consistencia visual
 * con el resto de las validaciones (PLAN-UI/vistas/admin-production.md).
 */
export default function ProductionComponentsPreview({
    supplySelected,
    supplyName,
    supplyUnit,
    components,
    producedQuantity,
}: ProductionComponentsPreviewProps) {
    if (!supplySelected) {
        return (
            <div className="flex flex-col gap-2">
                <div className="hidden items-center justify-between gap-4 sm:flex">
                    <Label className="text-sm font-semibold">Vista previa</Label>
                    <span className="text-[13px] text-muted-foreground">
                        Orientativa: al guardar se usa la receta vigente del preparado.
                    </span>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-xl border-[1.5px] border-dashed border-border px-6 py-7 text-center text-muted-foreground">
                    <Layers className="size-6" aria-hidden />
                    <p className="text-sm">Elegí un preparado para ver qué componentes consume.</p>
                </div>
            </div>
        )
    }

    if (components.length === 0) {
        return (
            <div className="flex flex-col gap-2">
                <div className="hidden items-center justify-between gap-4 sm:flex">
                    <Label className="text-sm font-semibold">Vista previa</Label>
                    <span className="text-[13px] text-muted-foreground">
                        Orientativa: al guardar se usa la receta vigente del preparado.
                    </span>
                </div>
                <WarningAlert
                    role="alert"
                    title="Este preparado no tiene componentes cargados"
                    description="Cargá su receta en Insumos antes de registrar una producción. No se va a enviar nada."
                />
            </div>
        )
    }

    const rows: Row[] = components.map((component) => ({
        ...component,
        noPriorProduction: component.origin === "produced" && component.unit_cost === 0,
    }))

    const withoutCost = rows.find((r) => r.noPriorProduction)

    const heading = producedQuantity > 0
        ? `Esto se va a consumir para ${formatQuantity(producedQuantity)} ${supplyUnit ?? ""} de ${supplyName ?? ""}`
        : "Esto se va a consumir"

    return (
        <div className="flex flex-col gap-2">
            <div className="hidden items-center justify-between gap-4 sm:flex">
                <Label className="text-sm font-semibold">Vista previa</Label>
                <span className="text-[13px] text-muted-foreground">
                    Orientativa: al guardar se usa la receta vigente del preparado.
                </span>
            </div>
            <PreviewTable heading={heading} rows={rows} producedQuantity={producedQuantity} />
            {withoutCost && (
                <WarningAlert
                    role="status"
                    title={`La ${withoutCost.name} todavía no tiene costo`}
                    description="Suma $0 hasta que registres su primera producción, así que este costo unitario va a quedar más bajo que el real."
                />
            )}
        </div>
    )
}
