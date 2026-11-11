import * as z from 'zod'

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce
        .number()
        .int()
        .min(1024, "Port must be 1024-65535")
        .max(65535, "Port must be 1024-65535")
        .default(3000),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/}),
    CORS_ORIGIN: z.url({ protocol: /^https?$/ })
        .refine((value) => URL.canParse(value) && new URL(value).origin === value, "CORS_ORIGIN must be an origin: scheme, host and optional port, no path or trailing slash"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    BETTING_WINDOW_MS: z.coerce
        .number()
        .int()
        .min(1000, "BETTING_WINDOW_MS must be at least 1000")
        .default(5 * 60 * 1000),
    TRUST_PROXY_HOPS: z.coerce
        .number()
        .int()
        .min(0, "TRUST_PROXY_HOPS must be 0-5")
        .max(5, "TRUST_PROXY_HOPS must be 0-5")
        .default(0)
})

export type Env = z.infer<typeof envSchema>


export function parseEnv(source: NodeJS.ProcessEnv): Env {
    const result = envSchema.safeParse(source)
    if (!result.success) {
        throw new Error(`invalid environment variables:\n${z.prettifyError(result.error)}`)
    }
    return result.data
}

export const env = parseEnv(process.env)