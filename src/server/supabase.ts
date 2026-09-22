import "server-only"

import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/shared/types/database.types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

// La clave secreta saltea RLS: un cliente por proceso, creado en el primer uso
// para que un import no rompa el build cuando las variables todavía no están.
let client: ReturnType<typeof createClient<Database>> | null = null

export const getServerSupabase = () => {
    if (!supabaseUrl) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL")
    if (!supabaseSecretKey) throw new Error("Falta SUPABASE_SECRET_KEY")

    if (!client) {
        client = createClient<Database>(supabaseUrl, supabaseSecretKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        })
    }

    return client
}
