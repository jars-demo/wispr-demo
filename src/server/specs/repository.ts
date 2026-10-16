import type { Db } from '@/server/db/types'
import {
  assignCodes,
  type SpecDraft,
  type SpecItem,
  type SpecItemKind,
  type StructuringEngine,
} from '@/domain/spec'

// Every function takes ownerId and filters by it. Another owner's spec behaves exactly like a
// spec that does not exist, so existence is never leaked.

export type SpecSummary = {
  id: string
  title: string
  version: number
  requirementCount: number
  updatedAt: Date
}

export type SpecRecord = {
  id: string
  title: string
  version: number
  transcript: string
  engine: StructuringEngine
  items: SpecItem[]
  createdAt: Date
  updatedAt: Date
}

type ItemRow = {
  position: number
  code: string
  kind: SpecItemKind
  text: string
  acceptance: string | null
  source_quote: string | null
  note: string | null
}

async function insertVersion(tx: Db, specId: string, version: number, draft: SpecDraft) {
  const versionId = crypto.randomUUID()
  await tx.query(
    'insert into spec_versions (id, spec_id, version, transcript, engine) values ($1, $2, $3, $4, $5)',
    [versionId, specId, version, draft.transcript, draft.engine],
  )
  const items = assignCodes(draft.items)
  const params: unknown[] = []
  const rows = items.map((item, i) => {
    params.push(
      versionId,
      item.position,
      item.code,
      item.kind,
      item.text,
      item.acceptance ?? null,
      item.sourceQuote ?? null,
      item.note ?? null,
    )
    const base = i * 8
    return `(${Array.from({ length: 8 }, (_, k) => `$${base + k + 1}`).join(', ')})`
  })
  await tx.query(
    `insert into spec_items (spec_version_id, position, code, kind, text, acceptance, source_quote, note) values ${rows.join(', ')}`,
    params,
  )
}

/** Idempotent on (ownerId, clientId): retrying the same save returns the first spec. */
export async function createSpec(
  db: Db,
  ownerId: string,
  clientId: string,
  draft: SpecDraft,
): Promise<{ id: string; created: boolean }> {
  return db.transaction(async (tx) => {
    const id = crypto.randomUUID()
    const inserted = await tx.query<{ id: string }>(
      `insert into specs (id, owner_id, client_id, title) values ($1, $2, $3, $4)
       on conflict (owner_id, client_id) do nothing returning id`,
      [id, ownerId, clientId, draft.title],
    )
    if (inserted.length === 0) {
      const [existing] = await tx.query<{ id: string }>(
        'select id from specs where owner_id = $1 and client_id = $2',
        [ownerId, clientId],
      )
      if (!existing) throw new Error('Spec insert conflicted but no existing row was found')
      return { id: existing.id, created: false }
    }
    await insertVersion(tx, id, 1, draft)
    return { id, created: true }
  })
}

export async function getSpec(db: Db, ownerId: string, id: string): Promise<SpecRecord | null> {
  const [spec] = await db.query<{
    id: string
    title: string
    version: number
    transcript: string
    engine: StructuringEngine
    version_id: string
    created_at: Date
    updated_at: Date
  }>(
    `select s.id, s.title, s.current_version as version, v.transcript, v.engine, v.id as version_id,
            s.created_at, s.updated_at
       from specs s
       join spec_versions v on v.spec_id = s.id and v.version = s.current_version
      where s.id = $1 and s.owner_id = $2`,
    [id, ownerId],
  )
  if (!spec) return null
  const items = await db.query<ItemRow>(
    `select position, code, kind, text, acceptance, source_quote, note
       from spec_items where spec_version_id = $1 order by position`,
    [spec.version_id],
  )
  return {
    id: spec.id,
    title: spec.title,
    version: spec.version,
    transcript: spec.transcript,
    engine: spec.engine,
    createdAt: spec.created_at,
    updatedAt: spec.updated_at,
    items: items.map((row) => ({
      position: row.position,
      code: row.code,
      kind: row.kind,
      text: row.text,
      acceptance: row.acceptance ?? undefined,
      sourceQuote: row.source_quote ?? undefined,
      note: row.note ?? undefined,
    })),
  }
}

export async function listSpecs(db: Db, ownerId: string, limit = 50): Promise<SpecSummary[]> {
  const rows = await db.query<{
    id: string
    title: string
    version: number
    requirement_count: number
    updated_at: Date
  }>(
    `select s.id, s.title, s.current_version as version, s.updated_at,
            (select count(*)::int from spec_items i
              where i.spec_version_id = v.id and i.kind = 'requirement') as requirement_count
       from specs s
       join spec_versions v on v.spec_id = s.id and v.version = s.current_version
      where s.owner_id = $1
      order by s.updated_at desc
      limit $2`,
    [ownerId, limit],
  )
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    version: row.version,
    requirementCount: row.requirement_count,
    updatedAt: row.updated_at,
  }))
}

export type UpdateResult =
  | { status: 'updated'; version: number }
  | { status: 'not_found' }
  | { status: 'conflict'; currentVersion: number }

/** Saves a new version. `expectedVersion` stops two tabs from silently overwriting each other. */
export async function updateSpec(
  db: Db,
  ownerId: string,
  id: string,
  expectedVersion: number,
  draft: SpecDraft,
): Promise<UpdateResult> {
  return db.transaction(async (tx) => {
    const [current] = await tx.query<{ current_version: number }>(
      'select current_version from specs where id = $1 and owner_id = $2 for update',
      [id, ownerId],
    )
    if (!current) return { status: 'not_found' }
    if (current.current_version !== expectedVersion) {
      return { status: 'conflict', currentVersion: current.current_version }
    }
    const version = current.current_version + 1
    await insertVersion(tx, id, version, draft)
    await tx.query(
      'update specs set title = $1, current_version = $2, updated_at = now() where id = $3',
      [draft.title, version, id],
    )
    return { status: 'updated', version }
  })
}

export async function deleteSpec(db: Db, ownerId: string, id: string): Promise<boolean> {
  const rows = await db.query('delete from specs where id = $1 and owner_id = $2 returning id', [
    id,
    ownerId,
  ])
  return rows.length > 0
}
