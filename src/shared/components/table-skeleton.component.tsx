import { cn } from "@/shared/utils/cn.util"
import { Card } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table"

export interface TableSkeletonProps {
    /** Encabezados reales de la tabla (se muestran mientras carga, para no saltar layout). */
    headers: string[]
    rows?: number
    /** Clase de ancho de Tailwind por columna (ej. ["w-52", "w-40", "w-20"]). */
    widths?: string[]
}

/** Estado "Cargando" de las tablas del admin: encabezados reales + filas de Skeleton. */
export function TableSkeleton({ headers, rows = 6, widths }: TableSkeletonProps) {
    return (
        <Card className="overflow-hidden p-0" aria-busy="true" aria-label="Cargando">
            <Table>
                <TableHeader>
                    <TableRow>
                        {headers.map((h) => (
                            <TableHead key={h} className="text-[13px] font-semibold text-muted-foreground">
                                {h}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: rows }, (_, r) => (
                        <TableRow key={r}>
                            {headers.map((h, c) => (
                                <TableCell key={h} className="py-3">
                                    <Skeleton className={cn("h-3.5", widths?.[c] ?? "w-28")} />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    )
}
