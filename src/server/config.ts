import 'server-only'
import { z } from 'zod'

// The only module that reads process.env. Everything else imports getConfig().

const optional = (schema: z.ZodString) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional())

const configSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    // Secret. Signs the anonymous owner cookie.
    SESSION_SECRET: z.string().min(32, 'must be at least 32 characters'),
    // Secret. Hosted Postgres. When absent outside production, an embedded PGlite database is used.
    DATABASE_URL: optional(z.string().regex(/^postgres(ql)?:\/\//, 'must be a postgres:// URL')),
    PGLITE_DIR: z.string().default('.data/pglite'),
    // Secret. Enables model-based structuring. Without it, the rules engine is used.
    ANTHROPIC_API_KEY: optional(z.string().min(1)),
    ANTHROPIC_MODEL: z.string().default('claude-opus-5-5'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.DATABASE_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: 'is required in production',
      })
    }
  })

type Env = z.infer<typeof configSchema>

export type DatabaseConfig = { kind: 'postgres'; url: string } | { kind: 'pglite'; dir: string }

export type ModelConfig = { provider: 'anthropic'; apiKey: string; model: string }

export type Config = Readonly<{
  environment: Env['NODE_ENV']
  logLevel: Env['LOG_LEVEL']
  sessionSecret: string
  database: DatabaseConfig
  model: ModelConfig | null
}>

export class ConfigError extends Error {
  override name = 'ConfigError'
}

/** Validates raw environment values. Error messages name the variable, never its value. */
export function parseConfig(env: Record<string, string | undefined>): Config {
  const result = configSchema.safeParse(env)
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    throw new ConfigError(`Invalid environment configuration:\n- ${problems.join('\n- ')}`)
  }
  const data = result.data
  const database: DatabaseConfig = data.DATABASE_URL
    ? { kind: 'postgres', url: data.DATABASE_URL }
    : { kind: 'pglite', dir: data.PGLITE_DIR }
  const model: ModelConfig | null = data.ANTHROPIC_API_KEY
    ? { provider: 'anthropic', apiKey: data.ANTHROPIC_API_KEY, model: data.ANTHROPIC_MODEL }
    : null
  return Object.freeze({
    environment: data.NODE_ENV,
    logLevel: data.LOG_LEVEL,
    sessionSecret: data.SESSION_SECRET,
    database,
    model,
  })
}

let cached: Config | undefined

export function getConfig(): Config {
  cached ??= parseConfig(process.env)
  return cached
}

/**
 * The validation message (variable names only, never values) when configuration is invalid,
 * or null when it is fine. Lets static pages and the health probe keep working while the
 * routes that need configuration fail clearly.
 */
export function configProblem(): string | null {
  try {
    getConfig()
    return null
  } catch (error) {
    if (error instanceof ConfigError) return error.message
    throw error
  }
}
