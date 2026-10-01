"use client"

import type { LucideIcon } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Lock, TriangleAlert, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Alert, AlertTitle } from "@/shared/components/ui/alert"
import { Button } from "@/shared/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/shared/components/ui/form"
import { Input } from "@/shared/components/ui/input"
import { cn } from "@/shared/utils/cn.util"
import usePostLogin from "../hooks/usePostLogin.hook"

const loginSchema = z.object({
    username: z.string().trim().min(1, "Ingresá tu usuario"),
    password: z.string().min(1, "Ingresá tu contraseña"),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
    next: string
}

interface LoginFieldIconProps {
    icon: LucideIcon
}

// Ícono superpuesto al input (mismo tratamiento en Usuario y Contraseña).
function LoginFieldIcon({ icon: Icon }: LoginFieldIconProps) {
    return <Icon className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" aria-hidden />
}

export default function LoginForm({ next }: LoginFormProps) {
    const router = useRouter()
    const postLogin = usePostLogin()

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { username: "", password: "" },
    })

    const onSubmit = (values: LoginFormValues) => {
        postLogin.mutate(values, {
            onSuccess: () => {
                router.replace(next)
                router.refresh()
            },
            // Mismo mensaje exista o no el usuario (lo decide la API); acá solo
            // devolvemos el foco a Contraseña para que puedan reintentar rápido.
            onError: () => form.setFocus("password"),
        })
    }

    return (
        <Form {...form}>
            <form
                noValidate
                aria-label="Iniciar sesión"
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-5"
            >
                <div className="flex flex-col gap-4">
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field, fieldState }) => (
                            <FormItem className="gap-1.5">
                                <FormLabel className="text-[15px] font-semibold">Usuario</FormLabel>
                                <div className="relative">
                                    <LoginFieldIcon icon={User} />
                                    <FormControl>
                                        <Input
                                            autoFocus
                                            autoComplete="username"
                                            className={cn(
                                                "h-14 rounded-xl pl-12 text-[17px] font-medium",
                                                fieldState.error && "border-negative ring-[3px] ring-destructive-muted",
                                            )}
                                            {...field}
                                        />
                                    </FormControl>
                                </div>
                                <FormMessage className="text-sm font-semibold text-negative" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field, fieldState }) => (
                            <FormItem className="gap-1.5">
                                <FormLabel className="text-[15px] font-semibold">Contraseña</FormLabel>
                                <div className="relative">
                                    <LoginFieldIcon icon={Lock} />
                                    <FormControl>
                                        <Input
                                            type="password"
                                            autoComplete="current-password"
                                            className={cn(
                                                "h-14 rounded-xl pl-12 text-[17px] font-medium tracking-[3px] tabular-nums",
                                                fieldState.error && "border-negative ring-[3px] ring-destructive-muted",
                                            )}
                                            {...field}
                                        />
                                    </FormControl>
                                </div>
                                <FormMessage className="text-sm font-semibold text-negative" />
                            </FormItem>
                        )}
                    />
                </div>

                <Button
                    type="submit"
                    disabled={postLogin.isPending}
                    className="h-16 w-full gap-2 rounded-[14px] px-7 text-xl font-extrabold"
                >
                    {postLogin.isPending ? (
                        <>
                            <Loader2 className="size-6 animate-spin" aria-hidden />
                            Entrando...
                        </>
                    ) : (
                        "Entrar"
                    )}
                </Button>

                {postLogin.isError && (
                    <Alert role="alert" className="flex items-start gap-3 border-transparent bg-destructive-muted text-destructive-muted-foreground">
                        <TriangleAlert className="mt-0.5 size-5" aria-hidden />
                        <AlertTitle className="text-base font-bold">{postLogin.error.message}</AlertTitle>
                    </Alert>
                )}
            </form>
        </Form>
    )
}
