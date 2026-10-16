import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { SpecDraft } from '@/domain/spec'
import { runMigrations } from '@/server/db/migrate'
import { createPgliteDb } from '@/server/db/pglite'
import type { Db } from '@/server/db/types'
import { createSpec, deleteSpec, getSpec, listSpecs, updateSpec } from '@/server/specs/repository'

// Real PostgreSQL (PGlite, in memory). A fresh database per test.

const ALICE = 'owner-alice'
const BOB = 'owner-bob'

const draft: SpecDraft = {
  title: 'Rate-limit login',
  transcript: 'Add rate limiting. Do not touch signup.',
  engine: 'rules',
  items: [
    { kind: 'requirement', text: 'Add rate limiting.', sourceQuote: 'Add rate limiting.' },
    { kind: 'non_goal', text: 'Do not touch signup.' },
    { kind: 'requirement', text: 'Add tests.', acceptance: 'CI is green.' },
  ],
}

let db: Db
let close: () => Promise<void>

beforeEach(async () => {
  ;({ db, close } = await createPgliteDb())
  await runMigrations(db)
})

afterEach(async () => {
  await close()
})

describe('migrations', () => {
  it('apply once and are a no-op the second time', async () => {
    expect(await runMigrations(db)).toEqual([])
  })

  it('enforce item kinds in the database as well as in the app', async () => {
    const { id } = await createSpec(db, ALICE, crypto.randomUUID(), draft)
    const [version] = await db.query<{ id: string }>(
      'select id from spec_versions where spec_id = $1',
      [id],
    )
    await expect(
      db.query(
        "insert into spec_items (spec_version_id, position, code, kind, text) values ($1, 99, 'X1', 'wish', 'x')",
        [version?.id],
      ),
    ).rejects.toThrow()
  })
})

describe('createSpec and getSpec', () => {
  it('stores the draft with codes assigned per kind', async () => {
    const { id, created } = await createSpec(db, ALICE, crypto.randomUUID(), draft)
    const spec = await getSpec(db, ALICE, id)

    expect(created).toBe(true)
    expect(spec).toMatchObject({ title: 'Rate-limit login', version: 1, engine: 'rules' })
    expect(spec?.items.map((item) => [item.code, item.text])).toEqual([
      ['R1', 'Add rate limiting.'],
      ['N1', 'Do not touch signup.'],
      ['R2', 'Add tests.'],
    ])
    expect(spec?.items[2]).toMatchObject({ acceptance: 'CI is green.', sourceQuote: undefined })
  })

  it('returns the original spec when the same save is retried', async () => {
    const clientId = crypto.randomUUID()
    const first = await createSpec(db, ALICE, clientId, draft)
    const retry = await createSpec(db, ALICE, clientId, { ...draft, title: 'Changed' })

    expect(retry).toEqual({ id: first.id, created: false })
    expect((await getSpec(db, ALICE, first.id))?.title).toBe('Rate-limit login')
    expect(await listSpecs(db, ALICE)).toHaveLength(1)
  })

  it('lets two owners use the same client id independently', async () => {
    const clientId = crypto.randomUUID()
    const a = await createSpec(db, ALICE, clientId, draft)
    const b = await createSpec(db, BOB, clientId, draft)

    expect(a.id).not.toBe(b.id)
  })
})

describe('ownership', () => {
  it('hides one owner’s spec from another on every operation', async () => {
    const { id } = await createSpec(db, ALICE, crypto.randomUUID(), draft)

    expect(await getSpec(db, BOB, id)).toBeNull()
    expect(await listSpecs(db, BOB)).toEqual([])
    expect(await updateSpec(db, BOB, id, 1, draft)).toEqual({ status: 'not_found' })
    expect(await deleteSpec(db, BOB, id)).toBe(false)
    expect(await getSpec(db, ALICE, id)).not.toBeNull()
  })
})

describe('updateSpec', () => {
  it('saves a new version and keeps the old one', async () => {
    const { id } = await createSpec(db, ALICE, crypto.randomUUID(), draft)
    const result = await updateSpec(db, ALICE, id, 1, {
      ...draft,
      title: 'Rate-limit login v2',
      items: [{ kind: 'requirement', text: 'Add rate limiting per user.' }],
    })
    const spec = await getSpec(db, ALICE, id)
    const versions = await db.query('select version from spec_versions where spec_id = $1', [id])

    expect(result).toEqual({ status: 'updated', version: 2 })
    expect(spec?.title).toBe('Rate-limit login v2')
    expect(spec?.items.map((item) => item.code)).toEqual(['R1'])
    expect(versions).toHaveLength(2)
  })

  it('refuses a stale save instead of overwriting newer work', async () => {
    const { id } = await createSpec(db, ALICE, crypto.randomUUID(), draft)
    await updateSpec(db, ALICE, id, 1, draft)

    expect(await updateSpec(db, ALICE, id, 1, draft)).toEqual({
      status: 'conflict',
      currentVersion: 2,
    })
  })
})

describe('listSpecs and deleteSpec', () => {
  it('lists newest first with requirement counts', async () => {
    const older = await createSpec(db, ALICE, crypto.randomUUID(), draft)
    const newer = await createSpec(db, ALICE, crypto.randomUUID(), { ...draft, title: 'Newer' })
    await db.query("update specs set updated_at = now() - interval '1 hour' where id = $1", [
      older.id,
    ])

    const list = await listSpecs(db, ALICE)
    expect(list.map((spec) => spec.id)).toEqual([newer.id, older.id])
    expect(list[0]?.requirementCount).toBe(2)
  })

  it('deletes the spec together with its versions and items', async () => {
    const { id } = await createSpec(db, ALICE, crypto.randomUUID(), draft)

    expect(await deleteSpec(db, ALICE, id)).toBe(true)
    expect(await getSpec(db, ALICE, id)).toBeNull()
    expect(await db.query('select 1 from spec_versions')).toEqual([])
    expect(await db.query('select 1 from spec_items')).toEqual([])
  })
})
