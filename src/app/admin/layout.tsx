import AdminSidebar from "@/features/admin/components/admin-sidebar.component"
import LogoutButton from "@/features/auth/components/logout-button.component"
import { SidebarProvider, SidebarTrigger } from "@/shared/components/ui/sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <main className="flex min-h-screen min-w-0 flex-1 flex-col bg-background">
                <div className="flex items-center gap-2 border-b p-4">
                    <SidebarTrigger className="cursor-pointer" />
                    <span className="font-semibold">Panel de administración</span>
                    <div className="ml-auto">
                        <LogoutButton />
                    </div>
                </div>
                <div className="flex-1 p-6">{children}</div>
            </main>
        </SidebarProvider>
    )
}
