"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm, type Control } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Loader } from "@/shared/components/loader.component"
import { Button } from "@/shared/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/components/ui/card"
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
import useGetConfig from "../hooks/useGetConfig.hook"
import usePatchConfig from "../hooks/usePatchConfig.hook"

const percentageField = (message: string) =>
    z.number({ error: message }).refine((value) => value >= 0 && value <= 100, message)

const settingsSchema = z.object({
    waste_percentage_food: percentageField("El porcentaje de pérdidas debe estar entre 0 y 100"),
    waste_percentage_drink: percentageField("El porcentaje de pérdidas debe estar entre 0 y 100"),
    waste_percentage_packaging: percentageField("El porcentaje de pérdidas debe estar entre 0 y 100"),
})

type SettingsValues = z.infer<typeof settingsSchema>

const emptyForm: SettingsValues = {
    waste_percentage_food: Number.NaN,
    waste_percentage_drink: Number.NaN,
    waste_percentage_packaging: Number.NaN,
}

// Un input numérico vacío no tiene número que reportar: NaN deja que el schema
// lo rechace en vez de que llegue un 0 que el usuario nunca escribió.
const parseNumericInput = (value: string, valueAsNumber: number) =>
    value === "" ? Number.NaN : valueAsNumber

const displayNumber = (value: number) => (Number.isNaN(value) ? "" : value)

interface NumericFieldProps {
    control: Control<SettingsValues>
    name: keyof SettingsValues
    label: string
    description: string
}

const NumericField = ({ control, name, label, description }: NumericFieldProps) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={displayNumber(field.value)}
                        onChange={(event) => field.onChange(
                            parseNumericInput(event.target.value, event.target.valueAsNumber),
                        )}
                    />
                </FormControl>
                <FormDescription>{description}</FormDescription>
                <FormMessage />
            </FormItem>
        )}
    />
)

export default function BusinessSettingsForm() {
    const { data: config, isLoading } = useGetConfig()
    const patchConfig = usePatchConfig()

    const form = useForm<SettingsValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: emptyForm,
    })

    useEffect(() => {
        if (!config) return

        form.reset({
            waste_percentage_food: config.waste_percentage_food,
            waste_percentage_drink: config.waste_percentage_drink,
            waste_percentage_packaging: config.waste_percentage_packaging,
        })
    }, [config])

    const onSubmit = (values: SettingsValues) => {
        patchConfig.mutate(values, {
            onSuccess: () => toast.success("Configuración actualizada"),
        })
    }

    if (isLoading) return <Loader className="h-64" />

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pérdidas por tipo de insumo</CardTitle>
                        <CardDescription>
                            Cuánto se pierde de cada tipo antes de llegar al plato. El margen
                            objetivo se carga en cada producto, los impuestos en su propia sección y
                            los costos fijos salen de los conceptos del último mes cerrado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <NumericField
                                control={form.control}
                                name="waste_percentage_food"
                                label="Pérdidas de comida (%)"
                                description="Se aplica sobre cada insumo de comida de la composición."
                            />
                            <NumericField
                                control={form.control}
                                name="waste_percentage_drink"
                                label="Pérdidas de bebida (%)"
                                description="Se aplica sobre cada insumo de bebida de la composición."
                            />
                            <NumericField
                                control={form.control}
                                name="waste_percentage_packaging"
                                label="Pérdidas de packaging (%)"
                                description="Se aplica sobre cada insumo de packaging de la composición."
                            />
                        </div>
                    </CardContent>
                </Card>

                <div>
                    <Button type="submit" disabled={patchConfig.isPending}>
                        Guardar configuración
                    </Button>
                </div>
            </form>
        </Form>
    )
}
