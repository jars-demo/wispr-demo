'use client'

import type { OwnAiKey } from '@/domain/ai'
import { isAiProvider } from '@/domain/ai'
import { createLocalStore } from '@/lib/local-store'

// Credentials for this browser only. The GitHub token is sent only to api.github.com. The AI key
// is sent with each breakdown request and used for that call only; neither is stored server-side.

export type Connection = { token: string; login: string }

export const githubStore = createLocalStore<Connection | null>('breakdown:github', (raw) => {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<Connection>
    return typeof value.token === 'string' && typeof value.login === 'string'
      ? { token: value.token, login: value.login }
      : null
  } catch {
    return null
  }
})

export const aiKeyStore = createLocalStore<OwnAiKey | null>('breakdown:ai', (raw) => {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<OwnAiKey>
    return typeof value.provider === 'string' &&
      isAiProvider(value.provider) &&
      typeof value.key === 'string' &&
      typeof value.model === 'string'
      ? { provider: value.provider, key: value.key, model: value.model }
      : null
  } catch {
    return null
  }
})
