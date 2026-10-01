"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Wallet } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/shared/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form"
import { Textarea } from "@/shared/components/ui/textarea"
import { DialogShell } from "@/shared/components/dialog-shell.component"
import usePostCashSession from "../hooks/usePostCashSession.hook"
import { MoneyAmountInput } from "./money-amount-input.component"

const openCashSessionSchema = z.object({
    opening_amount: z
        .number({ error: "Cargá el monto inicial. Si el cajón arranca vacío, poné 0." })
        .refine((value) => value >= 0, "Cargá el monto inicial. Si el cajón arranca vacío, poné 0."),
    note: z.string().trim().max(500, "La nota es demasiado larga"),
})

type OpenCashSessionFormValues = z.infer<typeof openCashSessionSchema>

const emptyForm = (): OpenCashSessionFormValues => ({
    opening_amount: Number.NaN,
    note: "",
})

// Un input numérico vacío no tiene número que reportar: NaN deja que el schema
// lo rechace en vez de que llegue un 0 que el usuario nunca escribió.
const parseNumericInput = (value: string, valueAsNumber: number) =>
    value === "" ? Number.NaN : valueAsNumber

const displayNumber = (value: number) => (Number.isNaN(value) ? "" : value)

interface OpenCashSessionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

/** El monto inicial es protagonista: es el único dato que de verdad importa para abrir la caja. */
export default function OpenCashSessionDialog({ open, onOpenChange }: OpenCashSessionDialogProps) {
    const postCashSession = usePostCashSession()

    const form = useForm<OpenCashSessionFormValues>({
        resolver: zodResolver(openCashSessionSchema),
        defaultValues: emptyForm(),
    })

    useEffect(() => {
        if (open) form.reset(emptyForm())
    }, [open])

    const onSubmit = (values: OpenCashSessionFormValues) => {
        postCashSession.mutate({
            opening_amount: values.opening_amount,
            note: values.note || null,
        }, {
            onSuccess: () => {
                toast.success("Caja abierta: ya se puede cobrar")
                onOpenChange(false)
            },
        })
    }

    const submitting = postCashSession.isPending

    return (
        <DialogShell
            open={open}
            onOpenChange={onOpenChange}
            title="Abrir caja"
            description="El monto inicial es la plata que hay en el cajón antes de la primera venta."
            mobileBarTitle="Abrir caja"
            widthClass="sm:max-w-md"
            footer={
                <>
                    <Button type="button" variant="outline" className="hidden h-10 sm:inline-flex" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="open-cash-session-form" disabled={submitting} className="h-12 w-full gap-2 sm:h-10 sm:w-auto">
                        {submitting
                            ? (<><Loader2 className="size-4 animate-spin" aria-hidden /> Abriendo…</>)
                            : (<><Wallet className="size-4" aria-hidden /> Abrir caja</>)}
                    </Button>
                </>
            }
        >
            <Form {...form}>
                <form id="open-cash-session-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <FormField
                        control={form.control}
                        name="opening_amount"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormLabel>Monto inicial</FormLabel>
                                <FormControl>
                                    <MoneyAmountInput
                                        large
                                        autoFocus
                                        invalid={!!fieldState.error}
                                        name={field.name}
                                        ref={field.ref}
                                        onBlur={field.onBlur}
                                        value={displayNumber(field.value)}
                                        onChange={(event) => field.onChange(
                                            parseNumericInput(event.target.value, event.target.valueAsNumber),
                                        )}
                                    />
                                </FormControl>
                                {!fieldState.error && <FormDescription>Puede ser $0 si el cajón arranca vacío.</FormDescription>}
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="note"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nota (opcional)</FormLabel>
                                <FormControl>
                                    <Textarea rows={2} placeholder="Ej.: fondo que dejó el turno anterior" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </form>
            </Form>
        </DialogShell>
    )
}
