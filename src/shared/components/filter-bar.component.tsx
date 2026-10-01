import { Search } from "lucide-react"
import type { ChangeEvent } from "react"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Switch } from "@/shared/components/ui/switch"

export interface FilterBarProps {
    searchPlaceholder: string
    searchValue?: string
    /** Sin esto la vista queda solo de muestra (ver `searchValue`/`onSearchChange`). */
    onSearchChange?: (value: string) => void
    /** Texto del switch, ej. "Solo activos" o "Solo bajo mínimo". Sin switchLabel no se muestra. */
    switchLabel?: string
    switchChecked?: boolean
    onSwitchChange?: (value: boolean) => void
    id?: string
}

/**
 * Buscador + switch de filtro de las listas del admin.
 * Controlado cuando la vista pasa `onSearchChange`/`onSwitchChange` (caso real); sin esos
 * callbacks queda no controlado (`defaultValue`/`defaultChecked`), útil solo para muestra.
 */
export function FilterBar({
    searchPlaceholder,
    searchValue,
    onSearchChange,
    switchLabel,
    switchChecked = false,
    onSwitchChange,
    id = "filtro",
}: FilterBarProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative w-full sm:max-w-[360px]">
                <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                />
                <Input
                    type="search"
                    aria-label={searchPlaceholder}
                    placeholder={searchPlaceholder}
                    {...(onSearchChange
                        ? { value: searchValue ?? "", onChange: (event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value) }
                        : { defaultValue: searchValue })}
                    className="h-11 pl-9 md:h-10"
                />
            </div>
            {switchLabel && (
                <div className="flex items-center gap-2.5">
                    <Switch
                        id={`${id}-switch`}
                        {...(onSwitchChange
                            ? { checked: switchChecked, onCheckedChange: onSwitchChange }
                            : { defaultChecked: switchChecked })}
                    />
                    <Label htmlFor={`${id}-switch`} className="text-sm font-semibold">
                        {switchLabel}
                    </Label>
                </div>
            )}
        </div>
    )
}
