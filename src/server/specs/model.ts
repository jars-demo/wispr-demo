import 'server-only'

import { getConfig } from '@/server/config'
import { createAnthropicStructurer } from '@/server/providers/structurer/anthropic'
import { createGroqStructurer } from '@/server/providers/structurer/groq'
import type { ModelStructurer } from '@/server/providers/structurer/types'

let structurer: ModelStructurer | null | undefined

/** The configured model structurer (Groq first, then Claude), or null for the rules engine. */
export function getModelStructurer(): ModelStructurer | null {
  if (structurer === undefined) {
    const { groq, model } = getConfig()
    structurer = groq ? createGroqStructurer(groq) : model ? createAnthropicStructurer(model) : null
  }
  return structurer
}
