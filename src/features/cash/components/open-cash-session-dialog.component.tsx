"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/shared/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/shared/components/ui/form"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import usePostCashSession from "../hooks/usePostCashSession.hook"

const openCashSessionSchema = z.object({
    opening_amount: z
        .number({ error: "El monto inicial debe ser 0 o mayor" })
        .refine((value) => value >= 0, "El monto inicial debe ser 0 o mayor"),
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Abrir caja</DialogTitle>
                    <DialogDescription>
                        El monto inicial es la plata que hay en el cajón antes de la primera venta.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="opening_amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto inicial</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            autoFocus
                                            name={field.name}
                                            ref={field.ref}
                                            onBlur={field.onBlur}
                                            value={displayNumber(field.value)}
                                            onChange={(event) => field.onChange(
                                                parseNumericInput(event.target.value, event.target.valueAsNumber),
                                            )}
                                        />
                                    </FormControl>
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
                                        <Textarea rows={2} placeholder="Turno tarde" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={postCashSession.isPending}>
                                Abrir caja
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
