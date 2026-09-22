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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/shared/components/ui/form"
import { Input } from "@/shared/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select"
import usePostCashMovement from "../hooks/usePostCashMovement.hook"
import { CASH_MOVEMENT_TYPE_LABELS, CASH_MOVEMENT_TYPES } from "../types/cash-movement.type"

const cashMovementFormSchema = z.object({
    type: z.enum(CASH_MOVEMENT_TYPES),
    amount: z
        .number({ error: "El monto debe ser mayor a 0" })
        .refine((value) => value > 0, "El monto debe ser mayor a 0"),
    concept: z
        .string()
        .trim()
        .min(1, "El concepto es obligatorio")
        .max(200, "El concepto es demasiado largo"),
})

type CashMovementFormValues = z.infer<typeof cashMovementFormSchema>

const emptyForm: CashMovementFormValues = {
    type: "deposit",
    amount: Number.NaN,
    concept: "",
}

// Un input numérico vacío no tiene número que reportar: NaN deja que el schema
// lo rechace en vez de que llegue un 0 que el usuario nunca escribió.
const parseNumericInput = (value: string, valueAsNumber: number) =>
    value === "" ? Number.NaN : valueAsNumber

const displayNumber = (value: number) => (Number.isNaN(value) ? "" : value)

interface CashMovementFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sessionId: number | null
}

export default function CashMovementFormDialog({
    open,
    onOpenChange,
    sessionId,
}: CashMovementFormDialogProps) {
    const postCashMovement = usePostCashMovement()

    const form = useForm<CashMovementFormValues>({
        resolver: zodResolver(cashMovementFormSchema),
        defaultValues: emptyForm,
    })

    useEffect(() => {
        if (open) form.reset(emptyForm)
    }, [open])

    const type = form.watch("type")

    const onSubmit = (values: CashMovementFormValues) => {
        if (!sessionId) return

        postCashMovement.mutate({ ...values, cash_session_id: sessionId }, {
            onSuccess: () => {
                toast.success(values.type === "deposit" ? "Ingreso registrado" : "Egreso registrado")
                onOpenChange(false)
            },
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Ingreso o egreso de caja</DialogTitle>
                    <DialogDescription>
                        Plata que entra o sale del cajón sin ser una venta. Entra al arqueo con su signo.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {CASH_MOVEMENT_TYPES.map((movementType) => (
                                                <SelectItem key={movementType} value={movementType}>
                                                    {CASH_MOVEMENT_TYPE_LABELS[movementType]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        {type === "deposit"
                                            ? "Suma al esperado en caja: un aporte de cambio, una reposición."
                                            : "Resta del esperado en caja: un retiro, un flete, una compra en efectivo."}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto</FormLabel>
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
                            name="concept"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Concepto</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Pago del flete" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Sin concepto el arqueo no se puede auditar.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={postCashMovement.isPending}>
                                Registrar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
