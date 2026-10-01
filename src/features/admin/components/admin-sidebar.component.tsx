"use client"

import { Store } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/shared/components/ui/sidebar"
import { ADMIN_SECTIONS } from "../config/admin-sections.config"

export default function AdminSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar>
            <SidebarHeader>
                <Link href="/admin" className="p-3">
                    <h2 className="text-xl font-bold">Administración</h2>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                {/* Acción principal arriba de todo: desde cualquier pantalla de admin hay que poder volver al POS en un toque. */}
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild variant="outline" size="lg" tooltip="Punto de venta">
                                <Link href="/pos">
                                    <Store />
                                    <span>Punto de venta</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>Secciones</SidebarGroupLabel>
                    <SidebarMenu>
                        {ADMIN_SECTIONS.map((section) => (
                            <SidebarMenuItem key={section.href}>
                                <SidebarMenuButton
                                    asChild={section.isAvailable}
                                    isActive={pathname.startsWith(section.href)}
                                    disabled={!section.isAvailable}
                                    tooltip={section.isAvailable ? section.label : "Todavía no disponible"}>
                                    {section.isAvailable
                                        ? (
                                            <Link href={section.href}>
                                                <section.icon />
                                                <span>{section.label}</span>
                                            </Link>
                                        )
                                        : (
                                            <>
                                                <section.icon />
                                                <span>{section.label}</span>
                                                <span className="ml-auto text-xs text-muted-foreground">Pronto</span>
                                            </>
                                        )}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
