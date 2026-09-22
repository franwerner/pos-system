import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"
import { findFreePort } from "./tests/flow/setup/free-port"
import { readLocalEnv, requireLocalEnv } from "./tests/flow/setup/local-env"

const PREFERRED_PORT = 3100

export default defineConfig(async () => {
    const localEnv = readLocalEnv()
    const port = await findFreePort(Number(process.env.FLOW_TEST_PORT) || PREFERRED_PORT)
    const baseUrl = `http://127.0.0.1:${port}`

    // El global setup corre en el proceso de vitest y los tests en workers aparte:
    // la URL tiene que viajar por las dos vías.
    process.env.FLOW_BASE_URL = baseUrl
    process.env.FLOW_PORT = String(port)

    return {
        plugins: [tsconfigPaths()],
        test: {
            environment: "node",
            include: ["tests/flow/**/*.test.ts"],
            globalSetup: ["tests/flow/setup/global-setup.ts"],
            // Los flujos tocan la misma base: corren de a uno para no pisarse.
            fileParallelism: false,
            testTimeout: 60_000,
            hookTimeout: 120_000,
            env: {
                FLOW_BASE_URL: baseUrl,
                FLOW_ADMIN_USERNAME: requireLocalEnv(localEnv, "SEED_ADMIN_USERNAME"),
                FLOW_ADMIN_PASSWORD: requireLocalEnv(localEnv, "SEED_ADMIN_PASSWORD"),
            },
        },
    }
})
