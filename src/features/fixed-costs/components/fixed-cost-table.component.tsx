"use client"

import { CalendarDays, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table"
import { EmptyState } from "@/shared/components/empty-state.component"
import { Money } from "@/shared/components/money.component"
import { RecordCard } from "@/shared/components/record-card.component"
import { RowActions } from "@/shared/components/row-actions.component"
import { TableSkeleton } from "@/shared/components/table-skeleton.component"
import { calculateFixedCostTotal } from "../services/calculateFixedCostTotal.service"
import { type FixedCost } from "../types/fixed-cost.type"

export const FIXED_COST_TABLE_HEADERS = ["Concepto", "Monto", "Acciones"]

interface FixedCostTableProps {
    fixedCosts: FixedCost[]
    isLoading: boolean
    onEdit: (fixedCost: FixedCost) => void
    onDelete: (fixedCost: FixedCost) => void
}

/** Estado "Cargando": tabla con encabezados reales (md+) o tarjetas de Skeleton (celular). */
function FixedCostsLoading() {
    return (
        <>
            <div className="hidden md:block">
                <TableSkeleton headers={FIXED_COST_TABLE_HEADERS} rows={4} widths={["w-[220px]", "w-[120px]", "w-[180px]"]} />
            </div>
            <div className="flex flex-col gap-2.5 md:hidden" aria-busy="true" aria-label="Cargando">
                {[0, 1, 2, 3].map((r) => (
                    <div key={r} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3.5">
                        <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
                    </div>
                ))}
            </div>
        </>
    )
}

/** Escritorio (md+): tabla con fila de total destacada. */
function FixedCostsTable({ costs, total, onEdit, onDelete }: {
    costs: FixedCost[]
    total: number
    onEdit: (fixedCost: FixedCost) => void
    onDelete: (fixedCost: FixedCost) => void
}) {
    return (
        <Card className="hidden overflow-hidden p-0 md:block">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-[13px] font-semibold text-muted-foreground">Concepto</TableHead>
                        <TableHead className="text-right text-[13px] font-semibold text-muted-foreground">Monto</TableHead>
                        <TableHead className="text-right text-[13px] font-semibold text-muted-foreground">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {costs.map((fixedCost) => (
                        <TableRow key={fixedCost.id}>
                            <TableCell className="py-3 font-semibold">{fixedCost.concept}</TableCell>
                            <TableCell className="text-right">
                                <Money value={fixedCost.amount} size="sm" />
                            </TableCell>
                            <TableCell>
                                <RowActions
                                    actions={[
                                        { label: "Editar", icon: Pencil, onClick: () => onEdit(fixedCost) },
                                        { label: "Eliminar", icon: Trash2, tone: "danger", onClick: () => onDelete(fixedCost) },
                                    ]}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter className="bg-muted">
                    <TableRow>
                        <TableCell className="py-3.5 text-base font-extrabold">Total del mes</TableCell>
                        <TableCell className="text-right"><Money value={total} className="text-lg font-extrabold" /></TableCell>
                        <TableCell />
                    </TableRow>
                </TableFooter>
            </Table>
        </Card>
    )
}

/** Celular (< md): tarjetas en vez de tabla. */
function FixedCostsCards({ costs, onEdit, onDelete }: {
    costs: FixedCost[]
    onEdit: (fixedCost: FixedCost) => void
    onDelete: (fixedCost: FixedCost) => void
}) {
    return (
        <div className="flex flex-col gap-2.5 md:hidden">
            {costs.map((fixedCost) => (
                <RecordCard
                    key={fixedCost.id}
                    title={fixedCost.concept}
                    value={<Money value={fixedCost.amount} className="text-lg font-bold" />}
                    actions={
                        <>
                            <Button variant="outline" size="sm" className="h-10" onClick={() => onEdit(fixedCost)}>
                                <Pencil className="size-4" aria-hidden /> Editar
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-10 text-negative hover:text-negative"
                                onClick={() => onDelete(fixedCost)}
                            >
                                <Trash2 className="size-4" aria-hidden /> Eliminar
                            </Button>
                        </>
                    }
                />
            ))}
        </div>
    )
}

/** Tabla (md+) + tarjetas (celular), fila/total de soporte, o el vacío si el mes no tiene costos. */
export default function FixedCostTable({ fixedCosts, isLoading, onEdit, onDelete }: FixedCostTableProps) {
    if (isLoading) return <FixedCostsLoading />

    if (fixedCosts.length === 0) {
        return (
            <Card className="border-0 bg-transparent p-0 shadow-none md:border md:bg-card md:p-5 md:shadow-sm">
                <EmptyState
                    icon={CalendarDays}
                    variant="plain"
                    title="El mes no tiene costos fijos cargados."
                    description="Sumá alquiler, luz, sueldos o lo que pagues todos los meses."
                />
            </Card>
        )
    }

    const total = calculateFixedCostTotal(fixedCosts)

    return (
        <>
            <FixedCostsTable costs={fixedCosts} total={total} onEdit={onEdit} onDelete={onDelete} />
            <FixedCostsCards costs={fixedCosts} onEdit={onEdit} onDelete={onDelete} />
        </>
    )
}
