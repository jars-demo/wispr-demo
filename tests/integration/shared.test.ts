import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { SyncInput } from '@/domain/board'
import { loadBoard, syncPlayer } from '@/server/board/service'
import { writeCached } from '@/server/breakdown/cache'
import type { BreakdownResult } from '@/server/breakdown/service'
import { runMigrations } from '@/server/db/migrate'
import { createPgliteDb } from '@/server/db/pglite'
import type { Db } from '@/server/db/types'
import {
  listMyShares,
  listShared,
  loadShare,
  shareBreakdown,
  unshareBreakdown,
} from '@/server/shared/service'

// Sharing against real SQL: consent per breakdown, public GitHub only, owner-scoped deletes, and
// a live feed that forgets a share the moment it is made private.

let db: Db
let close: () => Promise<void>

beforeAll(async () => {
  ;({ db, close } = await createPgliteDb())
  await runMigrations(db)
})

afterAll(async () => {
  await close()
})

const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const C = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const secret = (id: string) => `${id}-secret-long-enough`
const owner = (id: string) => ({ id, secret: secret(id) })

const join = (id: string, name: string, hidden = false): SyncInput => ({
  id,
  secret: secret(id),
  name,
  avatar: 'dev-she',
  xp: 100,
  breakdowns: 1,
  concepts: 1,
  achievements: [],
  hidden,
  profile: { v: 1, name },
})

const PR = 'https://github.com/acme/api/pull/7'
const result = (title: string) =>
  ({
    breakdown: { title },
    diff: { files: [] },
    dropped: 0,
    model: 'm',
  }) as unknown as BreakdownResult

beforeAll(async () => {
  await syncPlayer(db, join(A, 'Asha'))
  await syncPlayer(db, join(B, 'Bo'))
  await syncPlayer(db, join(C, 'Cy', true))
  await writeCached(db, 'gh:acme/api/pull/7', result('Retry failed webhooks'), 3600)
})

describe('sharing a breakdown', () => {
  it('refuses a change the server never broke down from a public link', async () => {
    expect(
      await shareBreakdown(db, { ...owner(A), url: 'https://github.com/acme/api/pull/8' }),
    ).toMatchObject({ ok: false, status: 410, code: 'not_shareable' })
    expect(await shareBreakdown(db, { ...owner(A), url: 'not a link' })).toMatchObject({
      ok: false,
      status: 422,
    })
  })

  it('refuses a player who has not saved, or the wrong secret', async () => {
    const stranger = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
    expect(await shareBreakdown(db, { ...owner(stranger), url: PR })).toMatchObject({
      ok: false,
      status: 404,
    })
    expect(await shareBreakdown(db, { id: A, secret: secret(B), url: PR })).toMatchObject({
      ok: false,
      status: 404,
    })
  })

  it('shares the server copy once per player and announces it in the live feed', async () => {
    const first = await shareBreakdown(db, { ...owner(A), url: `${PR}/files` })
    expect(first).toMatchObject({ ok: true, created: true })
    const again = await shareBreakdown(db, { ...owner(A), url: PR })
    expect(again).toMatchObject({ ok: true, created: false })
    if (!first.ok || !again.ok) throw new Error('share failed')
    expect(again.id).toBe(first.id)

    const share = await loadShare(db, first.id)
    expect(share).toMatchObject({
      url: PR,
      repo: 'acme/api',
      title: 'Retry failed webhooks',
      by: { name: 'Asha', avatar: 'dev-she' },
    })
    expect(share?.result.breakdown.title).toBe('Retry failed webhooks')

    const board = await loadBoard(db, null)
    const event = board.events.find((e) => e.kind === 'shared')
    expect(event).toMatchObject({
      text: 'Asha shared a breakdown of acme/api #7',
      href: `/b?shared=${first.id}`,
    })
  })

  it('lists each change once, newest first, with how many shared it', async () => {
    await shareBreakdown(db, { ...owner(B), url: PR })
    const items = await listShared(db)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ name: 'Bo', repo: 'acme/api', sharers: 2 })
    expect(Object.keys(items[0] ?? {})).not.toContain('playerId')
  })

  it('keeps hidden players out of the live feed but still shares', async () => {
    const shared = await shareBreakdown(db, { ...owner(C), url: PR })
    expect(shared).toMatchObject({ ok: true, created: true })
    const board = await loadBoard(db, null)
    expect(board.events.some((e) => e.text.startsWith('Cy'))).toBe(false)
  })

  it('lets only the owner make a share private, and the feed forgets it', async () => {
    const [mine] = await listMyShares(db, owner(A))
    if (!mine) throw new Error('missing share')
    expect(await listMyShares(db, { id: A, secret: secret(B) })).toEqual([])

    // Another player's id or secret behaves exactly like a missing share.
    expect(await unshareBreakdown(db, mine.id, owner(B))).toBe(false)
    expect(await unshareBreakdown(db, mine.id, { id: A, secret: secret(B) })).toBe(false)
    expect(await loadShare(db, mine.id)).not.toBeNull()

    expect(await unshareBreakdown(db, mine.id, owner(A))).toBe(true)
    expect(await loadShare(db, mine.id)).toBeNull()
    const board = await loadBoard(db, null)
    expect(board.events.some((e) => e.text.startsWith('Asha shared'))).toBe(false)
    expect(await unshareBreakdown(db, mine.id, owner(A))).toBe(false)
  })

  it('deletes shares with the player', async () => {
    await db.query('delete from players where id = $1', [B])
    expect(await listMyShares(db, owner(B))).toEqual([])
    expect((await listShared(db)).map((i) => i.name)).toEqual(['Cy'])
  })
})
