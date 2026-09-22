import { z } from "zod"
import { listTaxes } from "@/features/taxes/server/tax.repository"
import { normalizeTaxInput } from "@/features/taxes/services/normalizeTaxInput.service"
import { TAX_TYPES, usesAmount, usesPaymentMethod, type Tax } from "@/features/taxes/types/tax.type"
import { ApiError } from "@/server/api/api-error"
import { authenticatedRoute } from "@/server/api/handler"
import { getServerSupabase } from "@/server/supabase"

export const runtime = "nodejs"

const taxSchema = z.object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(80, "El nombre es demasiado largo"),
    type: z.enum(TAX_TYPES),
    rate: z
        .number()
        .min(0, "La tasa debe estar entre 0 y 100")
        .max(100, "La tasa debe estar entre 0 y 100")
        .optional(),
    amount: z.number().min(0, "El monto debe ser 0 o mayor").optional(),
    is_recoverable: z.boolean().optional(),
    payment_method_id: z.number().int().positive().nullable().optional(),
    is_active: z.boolean().optional(),
})

const updateTaxSchema = taxSchema.partial().extend({
    id: z.number().int().positive("El impuesto es obligatorio"),
})

const deleteTaxSchema = z.object({
    id: z.number().int().positive("El impuesto es obligatorio"),
})

type TaxValues = {
    name: string
    type: Tax["type"]
    rate: number
    amount: number
    is_recoverable: boolean
    payment_method_id: number | null
    is_active: boolean
}

const assertTypeRequirements = (values: TaxValues) => {
    if (usesAmount(values.type) && values.amount <= 0) {
        throw new ApiError(400, "Un monto fijo mensual necesita un monto mayor a 0")
    }

    if (usesPaymentMethod(values.type) && values.payment_method_id === null) {
        throw new ApiError(400, "Un impuesto por medio de pago necesita saber cuál")
    }
}

const readTax = async (id: number): Promise<Tax> => {
    const { data, error } = await getServerSupabase()
        .from("tax")
        .select("*")
        .eq("id", id)
        .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) throw new ApiError(404, "El impuesto no existe")

    return data as Tax
}

export const GET = authenticatedRoute({}, async ({ request }) =>
    listTaxes(request.nextUrl.searchParams.get("active") === "true"))

export const POST = authenticatedRoute({ body: taxSchema }, async ({ body }) => {
    const values = normalizeTaxInput({
        name: body.name,
        type: body.type,
        rate: body.rate ?? 0,
        amount: body.amount ?? 0,
        is_recoverable: body.is_recoverable ?? false,
        payment_method_id: body.payment_method_id ?? null,
        is_active: body.is_active ?? true,
    })

    assertTypeRequirements(values)

    const { data, error } = await getServerSupabase().from("tax").insert(values).select("*").single()

    if (error) throw new Error(error.message)

    return data
})

// El tipo decide qué campos aplican, así que un cambio parcial se resuelve sobre
// el impuesto completo: cambiar solo el tipo tiene que limpiar lo que quedó del
// anterior.
export const PATCH = authenticatedRoute({ body: updateTaxSchema }, async ({ body }) => {
    const { id, ...changes } = body
    const current = await readTax(id)

    const values = normalizeTaxInput({
        name: changes.name ?? current.name,
        type: changes.type ?? current.type,
        rate: changes.rate ?? current.rate,
        amount: changes.amount ?? current.amount,
        is_recoverable: changes.is_recoverable ?? current.is_recoverable,
        payment_method_id: changes.payment_method_id === undefined
            ? current.payment_method_id
            : changes.payment_method_id,
        is_active: changes.is_active ?? current.is_active,
    })

    assertTypeRequirements(values)

    const { data, error } = await getServerSupabase()
        .from("tax")
        .update(values)
        .eq("id", id)
        .select("*")
        .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) throw new ApiError(404, "El impuesto no existe")

    return data
})

export const DELETE = authenticatedRoute({ body: deleteTaxSchema }, async ({ body }) => {
    await readTax(body.id)

    const { error } = await getServerSupabase().from("tax").delete().eq("id", body.id)

    if (error) throw new Error(error.message)

    return { id: body.id }
})
