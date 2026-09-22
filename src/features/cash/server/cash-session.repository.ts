import { ApiError } from "@/server/api/api-error"
import { getServerSupabase } from "@/server/supabase"
import { type CashMovement } from "../types/cash-movement.type"
import { type CashSession, type CashSessionWithPayments } from "../types/cash-session.type"

export const readCashSessionId = (params: Record<string, string | string[]>): number => {
    const raw = Array.isArray(params.id) ? params.id[0] : params.id
    const id = Number(raw)

    if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "La caja no es válida")

    return id
}

export const findOpenCashSession = async (): Promise<CashSession | null> => {
    const { data, error } = await getServerSupabase()
        .from("cash_session")
        .select("*")
        .is("closed_at", null)
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) throw new Error(error.message)

    return data
}

export const requireOpenCashSession = async (): Promise<CashSession> => {
    const session = await findOpenCashSession()

    if (!session) throw new ApiError(400, "No hay una caja abierta: abrí la caja antes de cobrar")

    return session
}

export const requireCashSession = async (id: number): Promise<CashSession> => {
    const { data, error } = await getServerSupabase()
        .from("cash_session")
        .select("*")
        .eq("id", id)
        .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) throw new ApiError(404, "La caja no existe")

    return data
}

// El arqueo se arma desde los pagos, no desde la venta: con pago dividido una misma
// venta puede tener una parte en efectivo y otra que nunca entra al cajón.
export const listCashSessions = async (): Promise<CashSessionWithPayments[]> => {
    const { data, error } = await getServerSupabase()
        .from("cash_session")
        .select("*, sale(status, sale_payment(payment_method_id, amount, surcharge_amount)), cash_movement(*)")
        .order("opened_at", { ascending: false })

    if (error) throw new Error(error.message)

    return (data ?? []).map(({ sale, cash_movement, ...session }) => ({
        ...session,
        payments: sale
            .filter((item) => item.status === "paid")
            .flatMap((item) => item.sale_payment.map((payment) => ({
                payment_method_id: payment.payment_method_id,
                total: payment.amount + payment.surcharge_amount,
            }))),
        movements: [...(cash_movement as CashMovement[])]
            .sort((first, second) => first.created_at.localeCompare(second.created_at)),
    }))
}
