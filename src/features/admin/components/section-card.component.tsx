import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Badge } from "@/shared/components/ui/badge"
import { cn } from "@/shared/utils/cn.util"
import type { AdminSection } from "../config/admin-sections.config"

/** Cuadro de ícono con fondo accent (48px escritorio, 44px celular), igual al diseño. */
function SectionIcon({ icon: Icon }: { icon: AdminSection["icon"] }) {
    return (
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-accent text-accent-foreground md:size-12">
            <Icon className="size-6" aria-hidden />
        </span>
    )
}

/**
 * Tarjeta de acceso a una sección del admin.
 * Escritorio (md+): tarjeta vertical de 176px en grilla de 3 columnas.
 * Celular: fila horizontal de 72px (ícono + textos + flecha/badge a la derecha).
 * `isAvailable` decide si es un link real (flecha) o el patrón "Pronto" (deshabilitada,
 * sin href, badge en vez de flecha) — hoy todas las secciones están disponibles.
 */
export function SectionCard({ section }: { section: AdminSection }) {
    const className = cn(
        "flex min-h-[72px] flex-row items-center gap-3.5 rounded-[14px] border border-border bg-card p-3.5 text-card-foreground shadow-sm outline-none md:min-h-[176px] md:flex-col md:items-stretch md:rounded-xl md:p-[22px]",
        section.isAvailable
            ? "hover:border-input focus-visible:ring-2 focus-visible:ring-ring"
            : "opacity-55",
    )

    const content = (
        <>
            <div className="flex items-start justify-between md:w-full">
                <SectionIcon icon={section.icon} />
                {section.isAvailable
                    ? (
                        <ChevronRight
                            className="hidden size-4 text-muted-foreground md:block"
                            aria-hidden
                        />
                    )
                    : (
                        <Badge
                            variant="outline"
                            className="hidden rounded-full font-semibold text-muted-foreground md:inline-flex">
                            Pronto
                        </Badge>
                    )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:flex-none md:gap-1">
                <span className="text-base font-semibold md:text-[19px] md:font-bold md:leading-tight">
                    {section.label}
                </span>
                <span className="text-[13px] leading-snug text-muted-foreground md:text-sm">
                    {section.description}
                </span>
            </div>
            {section.isAvailable
                ? (
                    <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground md:hidden"
                        aria-hidden
                    />
                )
                : (
                    <Badge
                        variant="outline"
                        className="shrink-0 rounded-full font-semibold text-muted-foreground md:hidden">
                        Pronto
                    </Badge>
                )}
        </>
    )

    return section.isAvailable
        ? (
            <Link href={section.href} aria-label={section.label} className={className}>
                {content}
            </Link>
        )
        : (
            <div aria-disabled="true" className={className}>
                {content}
            </div>
        )
}
