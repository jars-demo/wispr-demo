import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { runMigrations } from '@/server/db/migrate'
import { createPgliteDb } from '@/server/db/pglite'
import type { Db } from '@/server/db/types'
import { hitRateLimit } from '@/server/rate-limit'

let db: Db
let close: () => Promise<void>

beforeEach(async () => {
  ;({ db, close } = await createPgliteDb())
  await runMigrations(db)
})

afterEach(async () => {
  await close()
})

describe('hitRateLimit', () => {
  const at = new Date('2026-10-16T10:00:30Z')

  it('allows hits up to the limit and refuses the next one', async () => {
    const results = []
    for (let i = 0; i < 4; i++) results.push(await hitRateLimit(db, 'k', 3, 60, at))

    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false])
  })

  it('reports the seconds left in the current window', async () => {
    expect((await hitRateLimit(db, 'k', 1, 60, at)).retryAfterSeconds).toBe(30)
  })

  it('starts counting again in the next window', async () => {
    await hitRateLimit(db, 'k', 1, 60, at)
    await hitRateLimit(db, 'k', 1, 60, at)

    expect((await hitRateLimit(db, 'k', 1, 60, new Date('2026-10-16T10:01:05Z'))).allowed).toBe(
      true,
    )
  })

  it('counts keys independently', async () => {
    await hitRateLimit(db, 'a', 1, 60, at)
    expect((await hitRateLimit(db, 'b', 1, 60, at)).allowed).toBe(true)
  })
})
