"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
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
import usePostLogin from "../hooks/usePostLogin.hook"

const loginSchema = z.object({
    username: z.string().trim().min(1, "Ingresá tu usuario"),
    password: z.string().min(1, "Ingresá tu contraseña"),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
    next: string
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
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Usuario</FormLabel>
                            <FormControl>
                                <Input autoFocus autoComplete="username" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                                <Input type="password" autoComplete="current-password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {postLogin.isError && (
                    <p className="text-sm text-destructive">{postLogin.error.message}</p>
                )}

                <Button type="submit" className="w-full" disabled={postLogin.isPending}>
                    {postLogin.isPending ? "Entrando..." : "Entrar"}
                </Button>
            </form>
        </Form>
    )
}
