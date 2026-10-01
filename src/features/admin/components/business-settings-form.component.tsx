"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
    CupSoda,
    Info,
    Loader2,
    Package,
    TriangleAlert,
    Utensils,
    type LucideIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useForm, type Control } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import useGetMeasuredParameters from "@/features/costing/hooks/useGetMeasuredParameters.hook"
import { type SupplyType } from "@/features/supplies/types/supply.type"
import MeasuredValue from "@/shared/components/measured-value.component"
import { Button } from "@/shared/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/shared/components/ui/input-group"
import { Spinner } from "@/shared/components/ui/spinner"
import useGetConfig from "../hooks/useGetConfig.hook"
import usePatchConfig from "../hooks/usePatchConfig.hook"

const REQUIRED_PERCENTAGE_MESSAGE = "Cargá un porcentaje. Si no se pierde nada, poné 0."
const RANGE_PERCENTAGE_MESSAGE = "Tiene que ser un número entre 0 y 100."

const percentageField = () =>
    z.number({ error: REQUIRED_PERCENTAGE_MESSAGE })
        .refine((value) => value >= 0 && value <= 100, RANGE_PERCENTAGE_MESSAGE)

const settingsSchema = z.object({
    waste_percentage_food: percentageField(),
    waste_percentage_drink: percentageField(),
    waste_percentage_packaging: percentageField(),
})

type SettingsValues = z.infer<typeof settingsSchema>
type SettingsField = keyof SettingsValues

const emptyForm: SettingsValues = {
    waste_percentage_food: Number.NaN,
    waste_percentage_drink: Number.NaN,
    waste_percentage_packaging: Number.NaN,
}

const WASTE_FIELDS: {
    name: SettingsField
    type: SupplyType
    label: string
    description: string
    icon: LucideIcon
}[] = [
    {
        name: "waste_percentage_food",
        type: "food",
        label: "Pérdidas de comida (%)",
        description: "Se aplica sobre cada insumo de comida de la composición.",
        icon: Utensils,
    },
    {
        name: "waste_percentage_drink",
        type: "drink",
        label: "Pérdidas de bebida (%)",
        description: "Se aplica sobre cada insumo de bebida de la composición.",
        icon: CupSoda,
    },
    {
        name: "waste_percentage_packaging",
        type: "packaging",
        label: "Pérdidas de packaging (%)",
        description: "Se aplica sobre cada insumo de packaging de la composición.",
        icon: Package,
    },
]

// Un input numérico vacío no tiene número que reportar: NaN deja que el schema
// lo rechace en vez de que llegue un 0 que el usuario nunca escribió.
const parseNumericInput = (value: string, valueAsNumber: number) =>
    value === "" ? Number.NaN : valueAsNumber

const displayNumber = (value: number) => (Number.isNaN(value) ? "" : value)

const round = (value: number) => Math.round(value * 100) / 100

interface WasteFieldRowProps {
    control: Control<SettingsValues>
    name: SettingsField
    label: string
    description: string
    icon: LucideIcon
    /** `null` cuando el mes no tuvo consumo de ese tipo contra el que medir la pérdida. */
    measured: number | null
    /** Recién copiado con "Usar este valor" y todavía sin guardar (ver `MeasuredValue`). */
    justAdopted: boolean
    onAdopt: () => void
    onManualChange: () => void
}

const WasteFieldRow = ({
    control,
    name,
    label,
    description,
    icon: Icon,
    measured,
    justAdopted,
    onAdopt,
    onManualChange,
}: WasteFieldRowProps) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem className="flex flex-col gap-2.5 md:border-t md:border-border md:py-[18px]">
                <div className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-muted text-muted-foreground">
                        <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="flex flex-col gap-px">
                        <div className="flex flex-wrap items-center gap-2">
                            <FormLabel className="text-sm font-semibold">{label}</FormLabel>
                            {justAdopted && (
                                <span className="rounded-full bg-warning-muted px-2 py-0.5 text-xs font-semibold text-warning-muted-foreground">
                                    Sin guardar
                                </span>
                            )}
                        </div>
                        <FormDescription className="text-[13px] text-muted-foreground">
                            {description}
                        </FormDescription>
                    </div>
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2.5 md:pl-[42px]">
                    <InputGroup className="h-11 w-[110px] shrink-0 md:h-10 md:w-[130px]">
                        <FormControl>
                            <InputGroupInput
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                name={field.name}
                                ref={field.ref}
                                onBlur={field.onBlur}
                                value={displayNumber(field.value)}
                                onChange={(event) => {
                                    field.onChange(
                                        parseNumericInput(event.target.value, event.target.valueAsNumber),
                                    )
                                    onManualChange()
                                }}
                                className="h-full text-[15px] font-medium tabular-nums"
                            />
                        </FormControl>
                        <InputGroupAddon align="inline-end">
                            <InputGroupText>%</InputGroupText>
                        </InputGroupAddon>
                    </InputGroup>
                    <div className="min-w-0 md:flex-1">
                        <MeasuredValue
                            label="Medido este mes:"
                            value={measured === null ? null : `${measured}%`}
                            emptyLabel="todavía no hubo consumo"
                            adopted={justAdopted}
                            onAdopt={onAdopt}
                        />
                    </div>
                </div>
                <FormMessage className="md:pl-[42px]" />
            </FormItem>
        )}
    />
)

export default function BusinessSettingsForm() {
    const { data: config, isLoading } = useGetConfig()
    const { data: measured } = useGetMeasuredParameters()
    const patchConfig = usePatchConfig()
    // Qué campos tienen el valor recién copiado de "Usar este valor" sin guardar todavía:
    // se limpia al guardar o en cuanto el usuario vuelve a tocar el campo a mano.
    const [justAdopted, setJustAdopted] = useState<Partial<Record<SettingsField, boolean>>>({})

    const form = useForm<SettingsValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: emptyForm,
    })

    const { isDirty } = form.formState

    useEffect(() => {
        if (!config) return

        form.reset({
            waste_percentage_food: config.waste_percentage_food,
            waste_percentage_drink: config.waste_percentage_drink,
            waste_percentage_packaging: config.waste_percentage_packaging,
        })
        setJustAdopted({})
    }, [config])

    const measuredWaste = (type: SupplyType): number | null => {
        const applied = measured?.waste[type]

        // `estimated` es el mes sin consumo de ese tipo: no hay nada medido que adoptar,
        // lo que informa es el porcentaje declarado devuelto.
        if (!applied || applied.basis !== "real") return null

        return round(applied.percentage)
    }

    const adopt = (name: SettingsField, value: number) => {
        form.setValue(name, value, { shouldDirty: true, shouldValidate: true })
        setJustAdopted((prev) => ({ ...prev, [name]: true }))
    }

    const clearAdopted = (name: SettingsField) => {
        setJustAdopted((prev) => (prev[name] ? { ...prev, [name]: false } : prev))
    }

    const onSubmit = (values: SettingsValues) => {
        patchConfig.mutate(values, {
            onSuccess: () => {
                // Los valores recién guardados pasan a ser el punto de partida: se acabó lo
                // "sin guardar", tanto por campo como en el pie.
                form.reset(values)
                setJustAdopted({})
                toast.success("Configuración actualizada", {
                    description: "El costo de la carta ya usa los nuevos porcentajes.",
                })
            },
            onError: (error) => {
                toast.error("No se pudo guardar la configuración", { description: error.message })
            },
        })
    }

    if (isLoading) {
        return (
            <Card
                className="max-w-[820px] items-center gap-3 px-6 py-14 text-center text-muted-foreground"
                aria-busy="true">
                <Spinner className="size-7" />
                <span className="text-sm font-semibold">Cargando la configuración…</span>
            </Card>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="pb-32 md:pb-0">
                <Card className="max-w-[820px] gap-0 p-0">
                    <CardHeader className="gap-1 px-4 pb-1.5 pt-4 md:px-5 md:pt-5">
                        <CardTitle className="text-lg font-bold">Pérdidas por tipo de insumo</CardTitle>
                        <CardDescription className="max-w-[700px] text-[13px] md:text-sm">
                            Cuánto se pierde de cada tipo antes de llegar al plato. Es el número que
                            entra al costo: al lado va lo que de verdad se perdió este mes, y
                            adoptarlo lo decidís vos. El margen objetivo se carga en cada producto y
                            tiene que cubrir impuestos, comisiones y gastos fijos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-[18px] px-4 pb-4 pt-3 md:gap-0 md:px-5 md:pb-0.5 md:pt-1">
                        {WASTE_FIELDS.map((waste) => {
                            const measuredValue = measuredWaste(waste.type)

                            return (
                                <WasteFieldRow
                                    key={waste.name}
                                    control={form.control}
                                    name={waste.name}
                                    label={waste.label}
                                    description={waste.description}
                                    icon={waste.icon}
                                    measured={measuredValue}
                                    justAdopted={!!justAdopted[waste.name]}
                                    onAdopt={() => adopt(waste.name, measuredValue ?? 0)}
                                    onManualChange={() => clearAdopted(waste.name)}
                                />
                            )
                        })}
                    </CardContent>
                    <CardFooter
                        className="fixed inset-x-0 bottom-0 z-20 flex-col items-stretch gap-2.5 border-t border-border bg-card px-4 pb-3.5 pt-3 shadow-lg md:static md:flex-row md:items-center md:justify-between md:rounded-b-xl md:bg-transparent md:px-5 md:py-4 md:shadow-none">
                        {isDirty ? (
                            <span className="flex items-center gap-2 text-[13px] font-semibold text-warning-muted-foreground md:text-sm">
                                <TriangleAlert className="size-4" aria-hidden />
                                Tenés cambios sin guardar
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 text-[13px] text-muted-foreground md:text-sm">
                                <Info className="size-4" aria-hidden />
                                Al guardar, se recalcula el costo de toda la carta.
                            </span>
                        )}
                        <Button type="submit" size="lg" className="h-12 md:h-10" disabled={patchConfig.isPending}>
                            {patchConfig.isPending
                                ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" aria-hidden />
                                        Guardando…
                                    </>
                                )
                                : "Guardar configuración"}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    )
}
