import 'server-only'
import { z } from 'zod'

// The only module that reads process.env. Everything else imports getConfig().

const optional = (schema: z.ZodString) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional())

const configSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    // Secret. Hosted Postgres for the leaderboard. When absent outside production, an embedded
    // PGlite database is used.
    DATABASE_URL: optional(z.string().regex(/^postgres(ql)?:\/\//, 'must be a postgres:// URL')),
    PGLITE_DIR: z.string().default('.data/pglite'),
    // Secret. Enables AI breakdowns. Without it, only the sample breakdowns work.
    GROQ_API_KEY: optional(z.string().min(1)),
    GROQ_MODEL: z.string().default('openai/gpt-oss-120b'),
    // Plain config. Breakdowns one visitor may start per hour (best effort, per server instance).
    BREAKDOWNS_PER_HOUR: z.coerce.number().int().min(1).max(1000).default(30),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.DATABASE_URL) {
      ctx.addIssue({ code: 'custom', path: ['DATABASE_URL'], message: 'is required in production' })
    }
  })

type Env = z.infer<typeof configSchema>

export type DatabaseConfig = { kind: 'postgres'; url: string } | { kind: 'pglite'; dir: string }

export type GroqConfig = { apiKey: string; model: string }

export type Config = Readonly<{
  environment: Env['NODE_ENV']
  logLevel: Env['LOG_LEVEL']
  database: DatabaseConfig
  groq: GroqConfig | null
  breakdownsPerHour: number
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
  return Object.freeze({
    environment: data.NODE_ENV,
    logLevel: data.LOG_LEVEL,
    database,
    groq: data.GROQ_API_KEY ? { apiKey: data.GROQ_API_KEY, model: data.GROQ_MODEL } : null,
    breakdownsPerHour: data.BREAKDOWNS_PER_HOUR,
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
