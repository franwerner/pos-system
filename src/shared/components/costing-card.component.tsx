import { Hourglass, TriangleAlert } from "lucide-react"
import { cn } from "@/shared/utils/cn.util"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import { Badge } from "@/shared/components/ui/badge"
import { Card } from "@/shared/components/ui/card"
import { Label } from "@/shared/components/ui/label"
import { Switch } from "@/shared/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table"
import { Money } from "@/shared/components/money.component"
import { PriceBelowSuggestedAlert } from "@/shared/components/price-alert.component"

/*
 * Tarjeta de costeo. Reglas de jerarquía:
 *  - Siempre 3 números en este orden: Cuesta hacerlo · Te queda por plato · Precio sugerido.
 *  - "Te queda por plato" es el PROTAGONISTA: más grande, al centro, fondo verde (≥0) o rojo (<0).
 *  - Sin margen objetivo: "Precio sugerido" muestra el link "Cargá el margen objetivo" (nunca $0 ni "—").
 *  - Sin receta: estado "Sin costear todavía" (nunca $0).
 *  - Switch "Ver detalle" discreto, arriba a la derecha; prendido agrega el desglose (vista dueño).
 * Todos los números vienen calculados como props: este componente no calcula nada
 * (el cálculo real vive en calculateProductCosting.service).
 */

export interface CostingDetailLine {
    supply: string
    /** "150 gr · Comida" */
    quantityLabel: string
    /** "$12,35/gr" (ya formateado, puede tener decimales) */
    unitCostLabel: string
    losses: number
    contribution: number
    isPrepared?: boolean
}

export interface CostingDetail {
    lines: CostingDetailLine[]
    suppliesTotal: number
    lossesTotal: number
    /** [{ label: "Comida (4,0%)", amount: 102 }] */
    lossesByType: { label: string; amount: number }[]
}

export type CostingCardProps =
    | { state: "uncosted"; showDetail?: boolean; onShowDetailChange?: (value: boolean) => void; layout?: "row" | "stacked"; switchId?: string }
    | {
          state: "costed"
          costToMake: number
          leftPerDish: number
          /** null = sin margen objetivo cargado. */
          suggestedPrice: number | null
          /** Margen objetivo en % (solo para el título en vista dueño). */
          targetMargin?: number
          currentPrice: number
          /** Viene como dato: true si hay margen objetivo y el precio actual quedó por debajo del sugerido. */
          priceBelowSuggested?: boolean
          showDetail?: boolean
          onShowDetailChange?: (value: boolean) => void
          detail?: CostingDetail
          /** Un preparado de la receta todavía no tiene producción: suma $0 (aviso amarillo). */
          preparedWithoutCost?: string
          /** "row" = 3 columnas (escritorio); "stacked" = apilado compacto (celular). */
          layout?: "row" | "stacked"
          /** id del switch "Ver detalle" (único si la tarjeta aparece dos veces en la página). */
          switchId?: string
      }

function Header({
    showDetail,
    onShowDetailChange,
    compact,
    switchId = "ver-detalle",
}: {
    showDetail?: boolean
    onShowDetailChange?: (value: boolean) => void
    compact?: boolean
    switchId?: string
}) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex flex-col gap-0.5">
                <h3 className="text-lg font-bold">Costo y precio sugerido</h3>
                {!compact && <span className="text-[13px] text-muted-foreground">Se recalcula mientras cargás la receta</span>}
            </div>
            <div className="flex items-center gap-2.5">
                <Switch id={switchId} checked={showDetail} onCheckedChange={onShowDetailChange} />
                <Label htmlFor={switchId} className="whitespace-nowrap text-sm font-medium text-muted-foreground">
                    Ver detalle
                </Label>
            </div>
        </div>
    )
}

export function CostingCard(props: CostingCardProps) {
    const stacked = props.layout === "stacked"

    if (props.state === "uncosted") {
        return (
            <Card className="gap-0 overflow-hidden rounded-2xl p-0">
                <Header showDetail={props.showDetail} onShowDetailChange={props.onShowDetailChange} compact={stacked} switchId={props.switchId} />
                <div className="flex flex-col items-center gap-2.5 px-6 py-8 text-center">
                    <div className="flex size-[52px] items-center justify-center rounded-xl bg-info-muted text-info-muted-foreground">
                        <Hourglass className="size-6" aria-hidden />
                    </div>
                    <p className="text-lg font-bold">Sin costear todavía</p>
                    <p className="max-w-[380px] text-sm text-muted-foreground">
                        Cargá insumos con su cantidad para ver el costo y el precio sugerido.
                    </p>
                </div>
            </Card>
        )
    }

    const {
        costToMake,
        leftPerDish,
        suggestedPrice,
        targetMargin,
        currentPrice,
        priceBelowSuggested,
        showDetail,
        onShowDetailChange,
        detail,
        preparedWithoutCost,
    } = props
    const negative = leftPerDish < 0
    const cell = cn("flex gap-1.5 px-5", stacked ? "flex-row items-center justify-between border-t border-border py-3" : "flex-col py-[18px]")

    return (
        <Card className="gap-0 overflow-hidden rounded-2xl p-0">
            <Header showDetail={showDetail} onShowDetailChange={onShowDetailChange} compact={stacked} switchId={props.switchId} />

            <div className={cn(!stacked && "grid grid-cols-[1fr_1.35fr_1fr] divide-x divide-border")}>
                <div className={cell}>
                    <span className="text-sm font-semibold text-muted-foreground">Cuesta hacerlo</span>
                    <Money value={costToMake} className={stacked ? "text-[22px] font-extrabold" : "text-[26px] font-extrabold leading-tight"} />
                    {!stacked && <span className="text-[13px] text-muted-foreground">insumos + pérdidas</span>}
                </div>

                <div
                    className={cn(
                        "flex flex-col gap-1.5 px-5",
                        stacked ? "border-t border-border py-4" : "py-[18px]",
                        negative ? "bg-destructive-muted text-destructive-muted-foreground" : "bg-success-muted text-success-muted-foreground",
                    )}
                >
                    <span className="text-sm font-semibold">Te queda por plato</span>
                    <Money value={leftPerDish} size="hero" tone={negative ? "negative" : "positive"} className={cn(negative && "text-destructive-muted-foreground")} />
                    <span className="text-[13px] opacity-85">{negative ? "perdés plata con cada plato" : "por cada plato que vendés"}</span>
                </div>

                <div className={cell}>
                    <span className="text-sm font-semibold text-muted-foreground">
                        {showDetail && suggestedPrice !== null && targetMargin !== undefined ? `Precio sugerido (margen ${targetMargin}%)` : "Precio sugerido"}
                    </span>
                    {suggestedPrice !== null ? (
                        <Money value={suggestedPrice} className={stacked ? "text-[22px] font-extrabold" : "text-[26px] font-extrabold leading-tight"} />
                    ) : (
                        <span className="text-left text-[15px] font-semibold text-accent-foreground">Cargá el margen objetivo</span>
                    )}
                    {!stacked && (
                        <span className="text-[13px] text-muted-foreground">
                            {suggestedPrice !== null ? "para tu margen objetivo" : "sin margen no hay sugerido"}
                        </span>
                    )}
                </div>
            </div>

            {priceBelowSuggested || preparedWithoutCost || (showDetail && detail) ? (
                <div className="flex flex-col gap-3.5 px-5 pb-5 pt-4">
                    {priceBelowSuggested && suggestedPrice !== null && (
                        <PriceBelowSuggestedAlert price={currentPrice} suggested={suggestedPrice} />
                    )}

                    {preparedWithoutCost && (
                        <Alert role="status" className="flex items-start gap-3 border-transparent bg-warning-muted text-warning-muted-foreground">
                            <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                            <div>
                                <AlertTitle className="font-bold">La {preparedWithoutCost} todavía no tiene costo</AlertTitle>
                                <AlertDescription className="text-warning-muted-foreground">
                                    Suma $0 hasta que registres su primera producción. El costo real va a ser más alto.
                                </AlertDescription>
                            </div>
                        </Alert>
                    )}

                    {showDetail && detail && (
                        <>
                            <Card className="overflow-hidden p-0 shadow-none">
                                <Table className="text-sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Insumo</TableHead>
                                            {!stacked && <TableHead className="text-right">Costo unitario</TableHead>}
                                            {!stacked && <TableHead className="text-right">Pérdidas</TableHead>}
                                            <TableHead className="text-right">{stacked ? "Aporte" : "Aporte al costo"}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {detail.lines.map((l) => (
                                            <TableRow key={l.supply}>
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-semibold">
                                                            {l.supply}{" "}
                                                            {l.isPrepared && (
                                                                <Badge className="h-5 rounded-full bg-info-muted text-xs text-info-muted-foreground">Preparado</Badge>
                                                            )}
                                                        </span>
                                                        <span className="text-[13px] text-muted-foreground">{l.quantityLabel}</span>
                                                    </div>
                                                </TableCell>
                                                {!stacked && <TableCell className="text-right tabular-nums">{l.unitCostLabel}</TableCell>}
                                                {!stacked && (
                                                    <TableCell className="text-right">
                                                        <Money value={l.losses} size="sm" className="font-normal" />
                                                    </TableCell>
                                                )}
                                                <TableCell className="text-right">
                                                    <Money value={l.contribution} size="sm" />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>

                            <dl className="flex flex-col text-[15px]">
                                <Row label="Insumos" value={detail.suppliesTotal} />
                                <Row label="Pérdidas" value={detail.lossesTotal} />
                                {detail.lossesByType.map((t) => (
                                    <Row key={t.label} label={`· ${t.label}`} value={t.amount} indent />
                                ))}
                                <Row label="Cuesta hacerlo" value={costToMake} total />
                                <Row label="Precio de venta" value={currentPrice} />
                                <div className="mt-1 flex justify-between gap-3 border-t border-border pt-2.5 font-extrabold">
                                    <dt>
                                        Te queda por plato <span className="text-[13px] font-medium text-muted-foreground">(margen de contribución)</span>
                                    </dt>
                                    <dd>
                                        <Money value={leftPerDish} size="sm" tone={negative ? "negative" : "positive"} className="text-[15px]" />
                                    </dd>
                                </div>
                            </dl>
                        </>
                    )}
                </div>
            ) : null}
        </Card>
    )
}

function Row({ label, value, indent, total }: { label: string; value: number; indent?: boolean; total?: boolean }) {
    return (
        <div className={cn("flex justify-between gap-3 py-1.5", indent && "pl-4 text-sm text-muted-foreground", total && "mt-1 border-t border-border pt-2.5 font-extrabold")}>
            <dt>{label}</dt>
            <dd>
                <Money value={value} size="sm" tone={indent ? "muted" : "default"} className={cn(!indent && "text-[15px]")} />
            </dd>
        </div>
    )
}
