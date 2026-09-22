import { createClient } from "@supabase/supabase-js"
import { hashPassword } from "../src/server/auth/password"
import type { Database } from "../src/shared/types/database.types"

const requireEnv = (name: string): string => {
    const value = process.env[name]

    if (!value) throw new Error(`Falta ${name} en .env.local`)

    return value
}

const main = async () => {
    const supabase = createClient<Database>(
        requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
        requireEnv("SUPABASE_SECRET_KEY"),
        { auth: { persistSession: false, autoRefreshToken: false } },
    )

    const username = requireEnv("SEED_ADMIN_USERNAME")
    const password_hash = await hashPassword(requireEnv("SEED_ADMIN_PASSWORD"))

    const { data: existing, error: readError } = await supabase
        .from("app_user")
        .select("id")
        .eq("username", username)
        .maybeSingle()

    if (readError) throw new Error(readError.message)

    if (existing) {
        const { error } = await supabase
            .from("app_user")
            .update({ password_hash })
            .eq("id", existing.id)

        if (error) throw new Error(error.message)

        console.log(`Usuario "${username}" actualizado`)
        return
    }

    const { error } = await supabase
        .from("app_user")
        .insert({ username, password_hash })

    if (error) throw new Error(error.message)

    console.log(`Usuario "${username}" creado`)
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
})
