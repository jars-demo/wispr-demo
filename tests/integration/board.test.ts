import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { SyncInput } from '@/domain/board'
import { runMigrations } from '@/server/db/migrate'
import { createPgliteDb } from '@/server/db/pglite'
import type { Db } from '@/server/db/types'
import { leaveBoard, loadBoard, restoreProfile, syncPlayer } from '@/server/board/service'

// Real SQL on in-memory PGlite: ownership, hidden players, ranks and events.

let db: Db
let close: () => Promise<void>

beforeAll(async () => {
  const created = await createPgliteDb()
  db = created.db
  close = created.close
  await runMigrations(db)
})

afterAll(async () => {
  await close()
})

const ASHA = '11111111-1111-4111-8111-111111111111'
const RAVI = '22222222-2222-4222-8222-222222222222'
const MIA = '33333333-3333-4333-8333-333333333333'

const player = (
  id: string,
  name: string,
  xp: number,
  extra: Partial<SyncInput> = {},
): SyncInput => ({
  id,
  secret: `${name}-secret-that-is-long-enough`,
  name,
  avatar: 'dev-she',
  xp,
  breakdowns: Math.ceil(xp / 500) || 1,
  concepts: 1,
  achievements: ['first'],
  hidden: false,
  profile: { v: 1, name },
  ...extra,
})

describe('leaderboard', () => {
  it('creates players and ranks them, naming the rival just ahead', async () => {
    expect(await syncPlayer(db, player(ASHA, 'Asha', 900))).toMatchObject({ ok: true })
    expect(await syncPlayer(db, player(RAVI, 'Ravi', 400))).toMatchObject({ ok: true })

    const board = await loadBoard(db, RAVI)
    expect(board.top.map((r) => [r.rank, r.name, r.isMe])).toEqual([
      [1, 'Asha', false],
      [2, 'Ravi', true],
    ])
    expect(board.me).toEqual({ rank: 2, xp: 400 })
    expect(board.rivalry).toBe('Asha is 500 XP ahead of you.')
    expect(board.events.map((e) => e.text)).toEqual(
      expect.arrayContaining(['Asha joined the board', 'Ravi joined the board']),
    )
  })

  it('treats someone else’s id like a missing player and changes nothing', async () => {
    const stolen = await syncPlayer(db, {
      ...player(ASHA, 'Mallory', 5000),
      secret: 'wrong-secret-but-long-enough',
    })
    expect(stolen).toMatchObject({ ok: false, status: 404 })
    const board = await loadBoard(db, null)
    expect(board.top[0]).toMatchObject({ name: 'Asha', xp: 900 })
    expect(await restoreProfile(db, ASHA, 'wrong-secret-but-long-enough')).toBeNull()
    expect(await leaveBoard(db, ASHA, 'wrong-secret-but-long-enough')).toBe(false)
  })

  it('records level ups and overtakes when a player saves new progress', async () => {
    await syncPlayer(db, player(RAVI, 'Ravi', 1600, { breakdowns: 4 }))
    const board = await loadBoard(db, ASHA)
    expect(board.top[0]?.name).toBe('Ravi')
    expect(board.me?.rank).toBe(2)
    expect(board.events[0]?.text).toMatch(/^Ravi /)
  })

  it('keeps hidden players off the board and out of the events, but restorable', async () => {
    await syncPlayer(db, player(MIA, 'Mia', 9000, { hidden: true, breakdowns: 20 }))
    const board = await loadBoard(db, null)
    expect(board.top.map((r) => r.name)).not.toContain('Mia')
    expect(board.events.map((e) => e.text).join(' ')).not.toContain('Mia')
    expect(board.players).toBe(2)
    expect(await restoreProfile(db, MIA, 'Mia-secret-that-is-long-enough')).toEqual({
      profile: { v: 1, name: 'Mia' },
      hidden: true,
    })
  })

  it('deletes a player and their events with the right secret', async () => {
    expect(await leaveBoard(db, RAVI, 'Ravi-secret-that-is-long-enough')).toBe(true)
    const board = await loadBoard(db, null)
    expect(board.top.map((r) => r.name)).toEqual(['Asha'])
    expect(board.events.map((e) => e.text).join(' ')).not.toContain('Ravi')
  })
})
