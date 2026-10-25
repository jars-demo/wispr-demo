import { describe, expect, it } from 'vitest'

import {
  describeEvent,
  EVENT_KINDS,
  isRename,
  nameLockedMessage,
  nameLockedUntil,
} from '@/domain/board'
import { changeLabel, shareSchema, sharedHref } from '@/domain/shared'

describe('shared breakdowns', () => {
  it('labels a change by its GitHub link', () => {
    expect(changeLabel('https://github.com/vercel/ms/pull/264')).toBe('vercel/ms #264')
    expect(changeLabel('https://github.com/vercel/ms/commit/1a2b3c4d5e6f')).toBe(
      'vercel/ms @ 1a2b3c4',
    )
    expect(changeLabel('https://github.com/vercel/ms/compare/main...next')).toBe('vercel/ms')
    expect(changeLabel('https://example.com/nope')).toBe('a change')
  })

  it('links to where a shared breakdown is played', () => {
    expect(sharedHref('06c63af9-b58a-4af9-a205-deaf708b0ca7')).toBe(
      '/b?shared=06c63af9-b58a-4af9-a205-deaf708b0ca7',
    )
  })

  it('describes a share in the live feed', () => {
    expect(EVENT_KINDS).toContain('shared')
    expect(describeEvent('shared', 'id', 'Asha', 'vercel/ms #264')).toBe(
      'Asha shared a breakdown of vercel/ms #264',
    )
    expect(describeEvent('shared', 'id', 'Asha')).toBe('Asha shared a breakdown of a change')
  })

  it('needs the player secret to share', () => {
    const base = {
      id: '06c63af9-b58a-4af9-a205-deaf708b0ca7',
      url: 'https://github.com/a/b/pull/1',
    }
    expect(shareSchema.safeParse(base).success).toBe(false)
    expect(shareSchema.safeParse({ ...base, secret: 'x'.repeat(24) }).success).toBe(true)
  })
})

describe('name changes', () => {
  const day = 24 * 3600 * 1000
  const now = new Date('2026-10-25T12:00:00Z')

  it('treats only a real change as a rename', () => {
    expect(isRename('Asha', 'ASHA')).toBe(false)
    expect(isRename('Asha', 'Asha K')).toBe(true)
  })

  it('locks the name for 180 days after a rename', () => {
    expect(nameLockedUntil(null, now)).toBeNull()
    const until = nameLockedUntil(new Date(now.getTime() - 10 * day), now)
    expect(until?.toISOString()).toBe('2027-04-13T12:00:00.000Z')
    expect(nameLockedUntil(new Date(now.getTime() - 180 * day), now)).toBeNull()
    expect(nameLockedMessage(until ?? now)).toBe(
      'You can change your name once every 180 days. Next change: April 13, 2027.',
    )
  })
})
