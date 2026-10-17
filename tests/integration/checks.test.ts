import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { runCheck } from '@/domain/check/engine'
import { SAMPLE_DIFF, SAMPLE_REQUEST, SAMPLE_SUMMARY } from '@/domain/check/sample'
import { structureWithRules } from '@/domain/structure-rules'
import { createCheck, getCheck, listChecks } from '@/server/checks/repository'
import { runMigrations } from '@/server/db/migrate'
import { createPgliteDb } from '@/server/db/pglite'
import type { Db } from '@/server/db/types'
import { parseGitHubLink } from '@/server/providers/github'
import { createSpec, deleteSpec, getSpec } from '@/server/specs/repository'

let db: Db
let close: () => Promise<void>

beforeEach(async () => {
  ;({ db, close } = await createPgliteDb())
  await runMigrations(db)
})

afterEach(async () => {
  await close()
})

async function seed(owner: string) {
  const structured = structureWithRules(SAMPLE_REQUEST)
  const { id } = await createSpec(db, owner, crypto.randomUUID(), {
    title: structured.title,
    transcript: SAMPLE_REQUEST,
    engine: 'rules',
    items: structured.items,
  })
  const spec = await getSpec(db, owner, id)
  if (!spec) throw new Error('seed failed')
  const result = runCheck({ items: spec.items, diff: SAMPLE_DIFF, summary: SAMPLE_SUMMARY })
  const checkId = await createCheck(db, {
    ownerId: owner,
    specId: id,
    specVersion: spec.version,
    sources: ['pasted_diff', 'agent_summary'],
    sourceLabel: null,
    result,
  })
  return { specId: id, checkId, result }
}

describe('checks repository', () => {
  it('stores and returns the result for its owner', async () => {
    const { specId, checkId, result } = await seed('alice')
    const check = await getCheck(db, 'alice', specId, checkId)

    expect(check?.result).toEqual(result)
    expect(check?.sources).toEqual(['pasted_diff', 'agent_summary'])
    expect(await listChecks(db, 'alice', specId)).toHaveLength(1)
  })

  it('hides checks from other owners', async () => {
    const { specId, checkId } = await seed('alice')

    expect(await getCheck(db, 'bob', specId, checkId)).toBeNull()
    expect(await listChecks(db, 'bob', specId)).toEqual([])
  })

  it('deletes checks along with their receipt', async () => {
    const { specId } = await seed('alice')
    await deleteSpec(db, 'alice', specId)

    expect(await db.query('select 1 from checks')).toEqual([])
  })
})

describe('parseGitHubLink', () => {
  it.each([
    ['https://github.com/acme/app/pull/42', 'pull', 'pull/42'],
    ['https://github.com/acme/app/pull/42/', 'pull', 'pull/42'],
    ['https://github.com/acme/app/compare/main...feature', 'compare', 'compare/main...feature'],
    ['https://github.com/acme/app/commit/abc1234', 'commit', 'commit/abc1234'],
  ])('accepts %s', (url, kind, path) => {
    expect(parseGitHubLink(url)).toMatchObject({ owner: 'acme', repo: 'app', kind, path })
  })

  it.each([
    'http://github.com/acme/app/pull/1',
    'https://evil.example/acme/app/pull/1',
    'https://github.com.evil.example/acme/app/pull/1',
    'https://github.com/acme/app/issues/1',
    'https://github.com/acme/app/pull/1/../../x',
  ])('rejects %s', (url) => {
    expect(parseGitHubLink(url)).toBeNull()
  })
})
