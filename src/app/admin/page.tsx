import Link from "next/link"
import { ADMIN_SECTIONS } from "@/features/admin/config/admin-sections.config"
import { Badge } from "@/shared/components/ui/badge"
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/components/ui/card"
import { cn } from "@/shared/utils/cn.util"

export default function AdminPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Administración</h1>
                <p className="text-sm text-muted-foreground">
                    Carga y mantenimiento de lo que el punto de venta consume.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {ADMIN_SECTIONS.map((section) => {
                    const card = (
                        <Card
                            className={cn(
                                "h-full transition",
                                section.isAvailable
                                    ? "hover:border-primary hover:shadow-sm"
                                    : "opacity-60",
                            )}>
                            <CardHeader>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <section.icon className="h-5 w-5 text-primary" />
                                        <CardTitle>{section.label}</CardTitle>
                                    </div>
                                    {!section.isAvailable && <Badge variant="outline">Pronto</Badge>}
                                </div>
                                <CardDescription>{section.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    )

                    return section.isAvailable
                        ? <Link key={section.href} href={section.href}>{card}</Link>
                        : <div key={section.href}>{card}</div>
                })}
            </div>
        </div>
    )
}
