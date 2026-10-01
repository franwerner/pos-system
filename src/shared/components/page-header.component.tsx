import type { ReactNode } from "react"

export interface PageHeaderProps {
    title: string
    description?: string
    /** Botones a la derecha (ej. <Button size="lg">Nuevo producto</Button>). En celular bajan debajo del título. */
    actions?: ReactNode
}

/** Encabezado de página del admin: título h1 + bajada + acciones. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
                {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
    )
}
