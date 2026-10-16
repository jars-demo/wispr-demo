import 'server-only'

import { getConfig } from '@/server/config'
import { createAnthropicStructurer } from '@/server/providers/structurer/anthropic'
import type { ModelStructurer } from '@/server/providers/structurer/types'

let structurer: ModelStructurer | null | undefined

/** The configured model structurer, or null when no API key is set. */
export function getModelStructurer(): ModelStructurer | null {
  if (structurer === undefined) {
    const { model } = getConfig()
    structurer = model ? createAnthropicStructurer(model) : null
  }
  return structurer
}
