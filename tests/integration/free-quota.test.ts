import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  freeKeys,
  peekFreeBreakdowns,
  refundFreeBreakdown,
  takeFreeBreakdown,
} from '@/server/breakdown/free-quota'
import { runMigrations } from '@/server/db/migrate'
import { createPgliteDb } from '@/server/db/pglite'
import type { Db } from '@/server/db/types'

// Free breakdowns: a few per browser, a ceiling per network, real SQL.

let db: Db
let close: () => Promise<void>

beforeEach(async () => {
  ;({ db, close } = await createPgliteDb())
  await runMigrations(db)
})

afterEach(async () => {
  await close()
})

const limits = { perVisitor: 2, perNetwork: 5 }
const browser = (n: number) => `00000000-0000-4000-8000-00000000000${n}`
const take = (visitor: string | null, network = 'wifi') =>
  takeFreeBreakdown(db, freeKeys(visitor, network), limits)

describe('free breakdowns', () => {
  it('gives every browser on one network its own two', async () => {
    for (const b of [1, 2]) {
      expect(await take(browser(b))).toEqual({ ok: true })
      expect(await take(browser(b))).toEqual({ ok: true })
      expect(await take(browser(b))).toMatchObject({ ok: false, code: 'free_limit' })
    }
  })

  it('caps one network even when it keeps minting new browser ids', async () => {
    const results = []
    for (const b of [1, 2, 3]) {
      results.push(await take(browser(b)), await take(browser(b)))
    }
    expect(results.map((r) => r.ok)).toEqual([true, true, true, true, true, false])
    expect(results[5]).toMatchObject({ ok: false, code: 'network_limit' })
    // Another network is not affected.
    expect(await take(browser(4), 'home')).toEqual({ ok: true })
  })

  it('counts a request without a browser id per network at the browser rate', async () => {
    expect(await take(null)).toEqual({ ok: true })
    expect(await take(null)).toEqual({ ok: true })
    expect(await take(null)).toMatchObject({ ok: false, code: 'free_limit' })
  })

  it('reports what a browser has left, capped by its network', async () => {
    const keys = freeKeys(browser(1), 'wifi')
    expect(await peekFreeBreakdowns(db, keys, limits)).toMatchObject({ limit: 2, left: 2 })
    await take(browser(1))
    expect(await peekFreeBreakdowns(db, keys, limits)).toMatchObject({ left: 1, used: 1 })

    for (const b of [2, 3]) await Promise.all([take(browser(b)), take(browser(b))])
    expect(await peekFreeBreakdowns(db, keys, limits)).toMatchObject({ left: 0 })
  })

  it('gives a failed breakdown back to the browser and the network', async () => {
    const keys = freeKeys(browser(1), 'wifi')
    await take(browser(1))
    await take(browser(1))
    await refundFreeBreakdown(db, keys)
    expect(await peekFreeBreakdowns(db, keys, limits)).toMatchObject({ left: 1 })
    expect(await take(browser(1))).toEqual({ ok: true })
  })
})
