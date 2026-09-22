import { z } from "zod"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"
import { listPaymentMethods } from "@/features/payment/server/payment-method.repository"

export const runtime = "nodejs"

const createPaymentMethodSchema = z.object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(60, "El nombre es demasiado largo"),
    tax: z.number()
        .gt(-100, "El descuento no puede llegar al 100%")
        .max(100, "El recargo no puede superar el 100%"),
    is_active: z.boolean().optional(),
})

const updatePaymentMethodSchema = createPaymentMethodSchema.partial().extend({
    id: z.number().int().positive("El método de pago es obligatorio"),
})

export const GET = authenticatedRoute({}, async ({ request }) =>
    listPaymentMethods(request.nextUrl.searchParams.get("active") === "true"))

export const POST = authenticatedRoute({ body: createPaymentMethodSchema }, async ({ body }) => {
    const { data, error } = await getServerSupabase()
        .from("payment_method")
        .insert(body)
        .select("*")
        .single()

    if (error) throw new Error(error.message)

    return data
})

export const PATCH = authenticatedRoute({ body: updatePaymentMethodSchema }, async ({ body }) => {
    const { id, ...values } = body

    const { data, error } = await getServerSupabase()
        .from("payment_method")
        .update(values)
        .eq("id", id)
        .select("*")
        .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) throw new ApiError(404, "El método de pago no existe")

    return data
})
