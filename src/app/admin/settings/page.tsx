import BusinessSettingsForm from "@/features/admin/components/business-settings-form.component"

export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Configuración</h1>
                <p className="text-sm text-muted-foreground">
                    Cuánto se pierde de cada tipo de insumo antes de llegar al plato.
                </p>
            </div>

            <BusinessSettingsForm />
        </div>
    )
}
