// Bring your own AI key. Breakdown runs on the shared free model by default; a player can add
// their own key in Settings for bigger changes and higher limits. The key lives in their browser
// and is sent along with each breakdown request; the server uses it for that call only.

export const AI_PROVIDERS = ['groq', 'openai', 'anthropic', 'openrouter'] as const
export type AiProvider = (typeof AI_PROVIDERS)[number]

export const AI_PROVIDER_INFO: Record<
  AiProvider,
  { label: string; defaultModel: string; keyUrl: string; keyHint: string }
> = {
  groq: {
    label: 'Groq',
    defaultModel: 'openai/gpt-oss-120b',
    keyUrl: 'https://console.groq.com/keys',
    keyHint: 'gsk_…',
  },
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-5-mini',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyHint: 'sk-…',
  },
  anthropic: {
    label: 'Anthropic',
    defaultModel: 'claude-opus-5-5',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyHint: 'sk-ant-…',
  },
  openrouter: {
    label: 'OpenRouter',
    defaultModel: 'openai/gpt-oss-120b',
    keyUrl: 'https://openrouter.ai/keys',
    keyHint: 'sk-or-…',
  },
}

export type OwnAiKey = { provider: AiProvider; key: string; model: string }

export const AI_HEADERS = {
  provider: 'x-ai-provider',
  key: 'x-ai-key',
  model: 'x-ai-model',
} as const

const MODEL = /^[\w.:/@-]{1,100}$/

export function isAiProvider(value: string): value is AiProvider {
  return (AI_PROVIDERS as readonly string[]).includes(value)
}

/** Reads a player's own key from request headers. Anything malformed means "use the default". */
export function ownKeyFrom(headers: { get(name: string): string | null }): OwnAiKey | null {
  const provider = headers.get(AI_HEADERS.provider)?.trim() ?? ''
  const key = headers.get(AI_HEADERS.key)?.trim() ?? ''
  if (!isAiProvider(provider) || key.length < 10 || key.length > 400 || /\s/.test(key)) return null
  const requested = headers.get(AI_HEADERS.model)?.trim() ?? ''
  const model = MODEL.test(requested) ? requested : AI_PROVIDER_INFO[provider].defaultModel
  return { provider, key, model }
}
