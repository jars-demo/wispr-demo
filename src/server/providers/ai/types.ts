import type { z } from 'zod'

// One small interface every AI provider implements: send a system and user message, get JSON that
// matches a schema back, or a typed failure. Our own zod validation runs on every answer.

export type JsonRequest<Schema extends z.ZodType> = {
  system: string
  user: string
  schemaName: string
  jsonSchema: Record<string, unknown>
  validate: Schema
  maxTokens: number
  timeoutMs: number
}

export type JsonModel = {
  provider: string
  model: string
  run<Schema extends z.ZodType>(request: JsonRequest<Schema>): Promise<z.infer<Schema>>
}

export type ModelFailure =
  'rate_limited' | 'too_large' | 'auth' | 'provider_error' | 'invalid_output' | 'timeout'

export class ModelUnavailableError extends Error {
  override name = 'ModelUnavailableError'
  constructor(readonly reason: ModelFailure) {
    super(`Model unavailable: ${reason}`)
  }
}

export function failureForStatus(status: number): ModelFailure {
  if (status === 401 || status === 403) return 'auth'
  if (status === 429) return 'rate_limited'
  if (status === 413) return 'too_large'
  return 'provider_error'
}
