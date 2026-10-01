import BusinessSettingsForm from "@/features/admin/components/business-settings-form.component"
import { PageHeader } from "@/shared/components/page-header.component"

export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Configuración"
                description="Cuánto se pierde de cada tipo de insumo antes de llegar al plato."
            />

            <BusinessSettingsForm />
        </div>
    )
}
