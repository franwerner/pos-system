import { cn } from "@/shared/utils/cn.util"
import { type Sale } from "../types/sale.type"
import Ticket from "./ticket.component"

/** Encabezado del comprobante impreso; el dueño todavía no tiene dónde cargar el nombre real
 * del local (no hay columna para eso), así que queda como placeholder hasta que se agregue. */
const STORE_NAME = "[Nombre del local]"

export interface PrintReceiptProps {
    order: Sale
    /** true = lo muestra en pantalla para revisión (no solo al imprimir). */
    preview?: boolean
}

/**
 * Comprobante impreso a 80mm (ancho térmico supuesto: confirmar el papel real con el dueño,
 * ver "Dudas" en `PLAN-UI/vistas/pos-order-ticket.md`). En la app solo aparece al imprimir
 * (`hidden print:block`); `preview` lo deja visible para revisarlo sin abrir el diálogo de impresión.
 */
export function PrintReceipt({ order, preview }: PrintReceiptProps) {
    return (
        <section
            aria-label="Ticket impreso"
            className={cn(
                "w-[80mm] bg-card px-4 pb-7 pt-5 text-sm text-foreground",
                preview ? "shadow-lg" : "hidden print:block",
            )}
        >
            <div className="mb-3 flex flex-col items-center gap-0.5 text-center">
                <span className="text-base font-bold">{STORE_NAME}</span>
                <span className="text-[13px]">Comprobante no fiscal</span>
            </div>
            <div className="flex flex-col gap-2.5">
                <Ticket {...order} print />
            </div>
            {order.status === "paid" && <p className="mt-4 text-center text-[13px]">¡Gracias por tu compra!</p>}
        </section>
    )
}
