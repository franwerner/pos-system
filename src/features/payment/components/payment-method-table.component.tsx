"use client"

import { CreditCard, Pencil, Plus } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Label } from "@/shared/components/ui/label"
import { Switch } from "@/shared/components/ui/switch"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table"
import { EmptyState } from "@/shared/components/empty-state.component"
import { RecordCard } from "@/shared/components/record-card.component"
import { InactiveBadge, RowActions } from "@/shared/components/row-actions.component"
import { TableSkeleton } from "@/shared/components/table-skeleton.component"
import { cn } from "@/shared/utils/cn.util"
import { type Payment } from "../types/payment.type"
import { AdjustmentBadge } from "./adjustment-badge.component"

export const PAYMENT_METHOD_TABLE_HEADERS = ["Nombre", "Ajuste", "Estado", "Acciones"]

interface PaymentMethodTableProps {
    paymentMethods: Payment[]
    isLoading: boolean
    /** Id de la tarifa cuyo switch está en vuelo (deshabilita solo esa fila, no toda la tabla). */
    togglingId: number | null
    onEdit: (paymentMethod: Payment) => void
    onToggleActive: (paymentMethod: Payment, isActive: boolean) => void
    onCreate: () => void
}

/** Switch directo de la fila: activa/desactiva sin confirmación (así lo pide el brief). */
function StateSwitch({ paymentMethod, disabled, onToggle }: {
    paymentMethod: Payment
    disabled: boolean
    onToggle: (isActive: boolean) => void
}) {
    const id = `tarifa-estado-${paymentMethod.id}`

    return (
        <div className="flex items-center gap-2.5">
            <Switch
                id={id}
                checked={paymentMethod.is_active}
                disabled={disabled}
                aria-label={`${paymentMethod.name}: ${paymentMethod.is_active ? "Activa" : "Inactiva"}`}
                onCheckedChange={onToggle}
            />
            <Label htmlFor={id} className="text-sm font-semibold">
                {paymentMethod.is_active ? "Activa" : "Inactiva"}
            </Label>
        </div>
    )
}

/** Estado "Cargando": tabla con encabezados reales (md+) o tarjetas de Skeleton (celular). */
function PaymentMethodsLoading() {
    return (
        <>
            <div className="hidden md:block">
                <TableSkeleton
                    headers={PAYMENT_METHOD_TABLE_HEADERS}
                    rows={4}
                    widths={["w-40", "w-[150px]", "w-[90px]", "w-[90px]"]}
                />
            </div>
            <div className="flex flex-col gap-3 md:hidden" aria-busy="true" aria-label="Cargando">
                {[0, 1, 2, 3].map((row) => (
                    <div key={row} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3.5">
                        <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
                    </div>
                ))}
            </div>
        </>
    )
}

/** Vacío: ofrece el mismo atajo que el encabezado para cargar la primera tarifa. */
function PaymentMethodsEmpty({ onCreate }: { onCreate: () => void }) {
    return (
        <Card className="max-w-[880px] p-5">
            <EmptyState
                icon={CreditCard}
                title="Todavía no hay tarifas cargadas."
                description="Cargá al menos un medio de pago (por ejemplo, Efectivo) para poder cobrar en el mostrador."
                action={
                    <Button className="h-11 gap-2 md:h-10" onClick={onCreate}>
                        <Plus className="size-4" aria-hidden />
                        Nueva tarifa
                    </Button>
                }
            />
        </Card>
    )
}

/** Escritorio (md+): tabla. La versión celular es `PaymentMethodsCards`. */
function PaymentMethodsTable({ paymentMethods, togglingId, onEdit, onToggleActive }: {
    paymentMethods: Payment[]
    togglingId: number | null
    onEdit: (paymentMethod: Payment) => void
    onToggleActive: (paymentMethod: Payment, isActive: boolean) => void
}) {
    return (
        <Card className="hidden max-w-[880px] overflow-hidden p-0 md:block">
            <Table className="text-[15px]">
                <TableHeader>
                    <TableRow>
                        {PAYMENT_METHOD_TABLE_HEADERS.map((header, index) => (
                            <TableHead
                                key={header}
                                className={cn(
                                    "text-[13px] font-semibold text-muted-foreground",
                                    index === PAYMENT_METHOD_TABLE_HEADERS.length - 1 && "text-right",
                                )}
                            >
                                {header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paymentMethods.map((paymentMethod) => (
                        <TableRow key={paymentMethod.id}>
                            <TableCell className="py-3 font-semibold">
                                <span className={cn(!paymentMethod.is_active && "opacity-55")}>
                                    {paymentMethod.name}
                                </span>
                                {!paymentMethod.is_active && (
                                    <span className="ml-1.5">
                                        <InactiveBadge label="Inactiva" />
                                    </span>
                                )}
                            </TableCell>
                            <TableCell className="py-3">
                                <span className={cn(!paymentMethod.is_active && "opacity-55")}>
                                    <AdjustmentBadge tax={paymentMethod.tax} />
                                </span>
                            </TableCell>
                            <TableCell className="py-3">
                                <StateSwitch
                                    paymentMethod={paymentMethod}
                                    disabled={togglingId === paymentMethod.id}
                                    onToggle={(isActive) => onToggleActive(paymentMethod, isActive)}
                                />
                            </TableCell>
                            <TableCell className="py-3 text-right">
                                <RowActions
                                    actions={[{ label: "Editar", icon: Pencil, onClick: () => onEdit(paymentMethod) }]}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    )
}

/** Celular (< md): tarjetas en vez de tabla, "Editar" arriba a la derecha. */
function PaymentMethodsCards({ paymentMethods, togglingId, onEdit, onToggleActive }: {
    paymentMethods: Payment[]
    togglingId: number | null
    onEdit: (paymentMethod: Payment) => void
    onToggleActive: (paymentMethod: Payment, isActive: boolean) => void
}) {
    return (
        <div className="flex flex-col gap-3 md:hidden">
            {paymentMethods.map((paymentMethod) => (
                <RecordCard
                    key={paymentMethod.id}
                    title={paymentMethod.name}
                    inactive={!paymentMethod.is_active}
                    value={
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 gap-1.5"
                            onClick={() => onEdit(paymentMethod)}
                        >
                            <Pencil className="size-4" aria-hidden />
                            Editar
                        </Button>
                    }
                    badges={
                        <>
                            <AdjustmentBadge tax={paymentMethod.tax} />
                            {!paymentMethod.is_active && <InactiveBadge label="Inactiva" />}
                        </>
                    }
                    actions={
                        <StateSwitch
                            paymentMethod={paymentMethod}
                            disabled={togglingId === paymentMethod.id}
                            onToggle={(isActive) => onToggleActive(paymentMethod, isActive)}
                        />
                    }
                />
            ))}
        </div>
    )
}

/** Tabla (md+) + tarjetas (celular), o el vacío si todavía no hay tarifas cargadas. */
export default function PaymentMethodTable({
    paymentMethods,
    isLoading,
    togglingId,
    onEdit,
    onToggleActive,
    onCreate,
}: PaymentMethodTableProps) {
    if (isLoading) return <PaymentMethodsLoading />

    if (paymentMethods.length === 0) return <PaymentMethodsEmpty onCreate={onCreate} />

    return (
        <>
            <PaymentMethodsTable
                paymentMethods={paymentMethods}
                togglingId={togglingId}
                onEdit={onEdit}
                onToggleActive={onToggleActive}
            />
            <PaymentMethodsCards
                paymentMethods={paymentMethods}
                togglingId={togglingId}
                onEdit={onEdit}
                onToggleActive={onToggleActive}
            />
        </>
    )
}
