import 'server-only'

import { failureForStatus, ModelUnavailableError, type JsonModel, type JsonRequest } from './types'

// Groq, OpenAI and OpenRouter share the chat completions API. Strict JSON-schema output, then our
// own zod validation on the parsed JSON, so a malformed answer can never reach the page.

export type CompatibleProvider = 'groq' | 'openai' | 'openrouter'

const ENDPOINTS: Record<CompatibleProvider, string> = {
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
}

function bodyFor(provider: CompatibleProvider, model: string, request: JsonRequest<never>) {
  return {
    model,
    // OpenAI reasoning models only accept the default temperature.
    ...(provider === 'openai' ? {} : { temperature: 0.2 }),
    ...(provider === 'openrouter'
      ? { max_tokens: request.maxTokens }
      : { max_completion_tokens: request.maxTokens }),
    messages: [
      { role: 'system', content: request.system },
      { role: 'user', content: request.user },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: request.schemaName, strict: true, schema: request.jsonSchema },
    },
  }
}

export function createCompatibleModel(
  provider: CompatibleProvider,
  apiKey: string,
  model: string,
): JsonModel {
  return {
    provider,
    model,
    async run(request) {
      let response: Response
      try {
        response = await fetch(ENDPOINTS[provider], {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            ...(provider === 'openrouter'
              ? { 'HTTP-Referer': 'https://wispr.jishanahmed.in', 'X-Title': 'Breakdown' }
              : {}),
          },
          body: JSON.stringify(bodyFor(provider, model, request as JsonRequest<never>)),
          signal: AbortSignal.timeout(request.timeoutMs),
          cache: 'no-store',
        })
      } catch {
        throw new ModelUnavailableError('timeout')
      }
      if (!response.ok) throw new ModelUnavailableError(failureForStatus(response.status))

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
      const parsed = request.validate.safeParse(json)
      if (!parsed.success) throw new ModelUnavailableError('invalid_output')
      return parsed.data
    },
  }
}
