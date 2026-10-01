import { SectionCard } from "@/features/admin/components/section-card.component"
import { ADMIN_SECTIONS } from "@/features/admin/config/admin-sections.config"
import { PageHeader } from "@/shared/components/page-header.component"

export default function AdminPage() {
    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Administración"
                description="Carga y mantenimiento de lo que el punto de venta consume."
            />
            <nav
                aria-label="Secciones de administración"
                className="flex flex-col gap-2.5 md:grid md:grid-cols-2 md:gap-[18px] lg:grid-cols-3">
                {ADMIN_SECTIONS.map((section) => (
                    <SectionCard key={section.href} section={section} />
                ))}
            </nav>
        </div>
    )
}
