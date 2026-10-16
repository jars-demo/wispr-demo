import 'server-only'

import type { z } from 'zod'

// Minimal Groq client (OpenAI-compatible REST). Strict JSON-schema output, then our own zod
// validation on the parsed JSON, so a malformed answer can never reach the page.

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

export class ModelUnavailableError extends Error {
  override name = 'ModelUnavailableError'
  constructor(readonly reason: 'rate_limited' | 'provider_error' | 'invalid_output' | 'timeout') {
    super(`Model unavailable: ${reason}`)
  }
}

export async function groqJson<Schema extends z.ZodType>(options: {
  apiKey: string
  model: string
  system: string
  user: string
  schemaName: string
  jsonSchema: Record<string, unknown>
  validate: Schema
  timeoutMs?: number
}): Promise<z.infer<Schema>> {
  let response: Response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model,
        temperature: 0,
        max_completion_tokens: 6000,
        messages: [
          { role: 'system', content: options.system },
          { role: 'user', content: options.user },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: options.schemaName, strict: true, schema: options.jsonSchema },
        },
      }),
      signal: AbortSignal.timeout(options.timeoutMs ?? 40_000),
      cache: 'no-store',
    })
  } catch {
    throw new ModelUnavailableError('timeout')
  }
  if (response.status === 429) throw new ModelUnavailableError('rate_limited')
  if (!response.ok) throw new ModelUnavailableError('provider_error')

  const body = (await response.json().catch(() => null)) as {
    choices?: { message?: { content?: string | null } }[]
  } | null
  const content = body?.choices?.[0]?.message?.content
  if (!content) throw new ModelUnavailableError('invalid_output')
  let json: unknown
  try {
    json = JSON.parse(content)
  } catch {
    throw new ModelUnavailableError('invalid_output')
  }
  const parsed = options.validate.safeParse(json)
  if (!parsed.success) throw new ModelUnavailableError('invalid_output')
  return parsed.data
}
