import { describe, expect, it } from 'vitest'

import { newOwnerId, signOwner, verifyOwner } from '@/server/owner'

const SECRET = 's'.repeat(32)

describe('owner cookie', () => {
  it('round-trips a freshly issued owner id', async () => {
    const id = newOwnerId()

    expect(id).toMatch(/^[A-Za-z0-9_-]{22}$/)
    expect(await verifyOwner(await signOwner(id, SECRET), SECRET)).toBe(id)
  })

  it('issues a different id every time', () => {
    expect(new Set(Array.from({ length: 50 }, newOwnerId)).size).toBe(50)
  })

  it('rejects a value signed with another secret', async () => {
    const value = await signOwner(newOwnerId(), 'o'.repeat(32))
    expect(await verifyOwner(value, SECRET)).toBeNull()
  })

  it('rejects a tampered owner id with a valid-looking signature', async () => {
    const value = await signOwner(newOwnerId(), SECRET)
    const [, signature] = value.split('.')
    expect(await verifyOwner(`${newOwnerId()}.${signature}`, SECRET)).toBeNull()
  })

  it.each([undefined, '', 'abc', 'a.b.c', `${'x'.repeat(22)}.!!!`, `${'x'.repeat(21)}.abc`])(
    'rejects malformed value %o',
    async (value) => {
      expect(await verifyOwner(value, SECRET)).toBeNull()
    },
  )
})
