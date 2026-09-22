import { authenticatedRoute } from "@/server/api/handler"

export const runtime = "nodejs"

export const GET = authenticatedRoute({}, async ({ user }) => ({ user }))
