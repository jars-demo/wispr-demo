import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { SyncInput } from '@/domain/board'
import { nameAvailable, syncPlayer } from '@/server/board/service'
import { readCached, writeCached } from '@/server/breakdown/cache'
import type { BreakdownResult } from '@/server/breakdown/service'
import { runMigrations } from '@/server/db/migrate'
import { createPgliteDb } from '@/server/db/pglite'
import type { Db } from '@/server/db/types'
import { hitRateLimit, peekRateLimit, refundRateLimit } from '@/server/rate-limit'

let db: Db
let close: () => Promise<void>

beforeAll(async () => {
  ;({ db, close } = await createPgliteDb())
  await runMigrations(db)
})

afterAll(async () => {
  await close()
})

const join = (id: string, name: string): SyncInput => ({
  id,
  secret: `${id}-secret-long-enough`,
  name,
  avatar: 'dev-she',
  xp: 100,
  breakdowns: 1,
  concepts: 1,
  achievements: [],
  hidden: false,
  profile: { v: 1, name },
})

const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

describe('one rename every 180 days', () => {
  const R = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
  const lastChange = (days: number) =>
    db.query(
      `update players set name_changed_at = now() - make_interval(days => $2) where id = $1`,
      [R, days],
    )

  it('claims freely, allows one rename, then locks the name with the unlock date', async () => {
    expect(await syncPlayer(db, join(R, 'Ravi'))).toMatchObject({ ok: true, renameAfter: null })
    expect(await syncPlayer(db, join(R, 'RAVI'))).toMatchObject({ renameAfter: null }) // case is free
    const renamed = await syncPlayer(db, join(R, 'Ravi K'))
    // Every save after a rename tells the browser when the name unlocks.
    expect(renamed.ok && renamed.renameAfter).toBeTruthy()

    const locked = await syncPlayer(db, join(R, 'Ravi Kumar'))
    expect(locked).toMatchObject({ ok: false, status: 409, code: 'name_locked', name: 'Ravi K' })
    expect(locked.ok ? '' : locked.reason).toContain('once every 180 days')
    // Other progress still saves under the kept name.
    expect(await syncPlayer(db, { ...join(R, 'Ravi K'), xp: 150 })).toMatchObject({ ok: true })
  })

  it('unlocks once 180 days have passed', async () => {
    await lastChange(179)
    expect(await syncPlayer(db, join(R, 'Ravi Kumar'))).toMatchObject({ code: 'name_locked' })
    await lastChange(181)
    expect(await syncPlayer(db, join(R, 'Ravi Kumar'))).toMatchObject({ ok: true })
    expect(await syncPlayer(db, join(R, 'Ravi K2'))).toMatchObject({ code: 'name_locked' })
  })
})

describe('unique names', () => {
  it('gives a name to the first player and refuses it to the next, ignoring case', async () => {
    expect(await nameAvailable(db, 'Mr Jha')).toBe(true)
    expect(await syncPlayer(db, join(A, 'Mr Jha'))).toMatchObject({ ok: true })

    expect(await nameAvailable(db, 'mr jha')).toBe(false)
    expect(await syncPlayer(db, join(B, 'MR JHA'))).toMatchObject({
      ok: false,
      status: 409,
      code: 'name_taken',
    })
  })

  it('lets a player keep saving under their own name and change its case', async () => {
    expect(await syncPlayer(db, join(A, 'Mr Jha'))).toMatchObject({ ok: true })
    expect(await syncPlayer(db, join(A, 'MR JHA'))).toMatchObject({ ok: true })
  })

  it('frees the old name after a rename', async () => {
    expect(await syncPlayer(db, join(A, 'Jha'))).toMatchObject({ ok: true })
    expect(await syncPlayer(db, join(B, 'Mr Jha'))).toMatchObject({ ok: true })
  })
})

describe('breakdown cache', () => {
  const result = { breakdown: { title: 'x' } } as unknown as BreakdownResult

  it('returns a stored breakdown until it expires', async () => {
    await writeCached(db, 'gh:a/b/pull/1', result, 60)
    expect(await readCached(db, 'gh:a/b/pull/1')).toEqual(result)

    await writeCached(db, 'gh:a/b/pull/2', result, 0)
    expect(await readCached(db, 'gh:a/b/pull/2')).toBeNull()
  })
})

describe('free quota', () => {
  const at = new Date('2026-10-25T10:10:00Z')

  it('counts hits, gives one back on refund, and never goes below zero', async () => {
    expect(await peekRateLimit(db, 'q', 2, 3600, at)).toMatchObject({ used: 0, left: 2 })
    await hitRateLimit(db, 'q', 2, 3600, at)
    await hitRateLimit(db, 'q', 2, 3600, at)
    expect(await peekRateLimit(db, 'q', 2, 3600, at)).toMatchObject({
      used: 2,
      left: 0,
      resetsInSeconds: 3000,
    })

    await refundRateLimit(db, 'q', 3600, at)
    expect(await peekRateLimit(db, 'q', 2, 3600, at)).toMatchObject({ left: 1 })
    await refundRateLimit(db, 'q', 3600, at)
    await refundRateLimit(db, 'q', 3600, at)
    expect(await peekRateLimit(db, 'q', 2, 3600, at)).toMatchObject({ used: 0, left: 2 })
  })
})
