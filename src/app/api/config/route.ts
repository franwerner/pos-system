import { z } from "zod"
import { type ConfigPos } from "@/features/admin/types/config.type"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"

export const runtime = "nodejs"

const CONFIG_COLUMNS =
    "waste_percentage_food, waste_percentage_drink, waste_percentage_packaging, default_employee_id, default_payment_id"

const wastePercentageSchema = z
    .number()
    .min(0, "El porcentaje de pérdidas debe estar entre 0 y 100")
    .max(100, "El porcentaje de pérdidas debe estar entre 0 y 100")

const patchConfigSchema = z.object({
    waste_percentage_food: wastePercentageSchema,
    waste_percentage_drink: wastePercentageSchema,
    waste_percentage_packaging: wastePercentageSchema,
    // Opcionales: los flujos que solo tocan el costeo no tienen por qué reenviar
    // el empleado ni el medio de pago por defecto.
    default_employee_id: z.uuid("El empleado por defecto no es válido").nullable().optional(),
    default_payment_id: z.number().int().positive().nullable().optional(),
})

const readConfig = async (): Promise<ConfigPos> => {
    const { data, error } = await getServerSupabase()
        .from("app_config")
        .select("*, default_payment:payment_method(*)")
        .limit(1)
        .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) throw new ApiError(404, "No hay configuración cargada")

    if (!data.default_payment) {
        throw new ApiError(409, "La configuración no tiene un medio de pago por defecto")
    }

    return { ...data, default_payment: data.default_payment }
}

export const GET = authenticatedRoute({}, readConfig)

export const PATCH = authenticatedRoute({ body: patchConfigSchema }, async ({ body }) => {
    const { data, error } = await getServerSupabase()
        .from("app_config")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", 1)
        .select(CONFIG_COLUMNS)
        .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) throw new ApiError(404, "No hay configuración cargada")

    return data
})
