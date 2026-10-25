import 'server-only'

import type { OwnAiKey } from '@/domain/ai'
import type { GroqConfig } from '@/server/config'

import { createAnthropicModel } from './anthropic'
import { createCompatibleModel } from './openai-compatible'
import type { JsonModel } from './types'

export { ModelUnavailableError, type JsonModel } from './types'

/** The player's own key when they set one, otherwise the shared default, otherwise none. */
export function resolveModel(own: OwnAiKey | null, shared: GroqConfig | null): JsonModel | null {
  if (own) {
    return own.provider === 'anthropic'
      ? createAnthropicModel(own.key, own.model)
      : createCompatibleModel(own.provider, own.key, own.model)
  }
  return shared ? createCompatibleModel('groq', shared.apiKey, shared.model) : null
}
