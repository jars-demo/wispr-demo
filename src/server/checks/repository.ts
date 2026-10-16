import type { CheckResult } from '@/domain/check/engine'
import type { EvidenceSourceKind } from '@/domain/evidence-source'
import type { Db } from '@/server/db/types'

// Checks are stored as their result only. The pasted diff, summary and test output are not
// kept: the result already holds the short quotes it cites.

export type CheckRecord = {
  id: string
  specId: string
  specVersion: number
  sources: EvidenceSourceKind[]
  sourceLabel: string | null
  result: CheckResult
  createdAt: Date
}

type Row = {
  id: string
  spec_id: string
  spec_version: number
  sources: EvidenceSourceKind[]
  source_label: string | null
  result: CheckResult | string
  created_at: Date
}

function toRecord(row: Row): CheckRecord {
  return {
    id: row.id,
    specId: row.spec_id,
    specVersion: row.spec_version,
    sources: row.sources,
    sourceLabel: row.source_label,
    result: typeof row.result === 'string' ? (JSON.parse(row.result) as CheckResult) : row.result,
    createdAt: row.created_at,
  }
}

export async function createCheck(
  db: Db,
  input: {
    ownerId: string
    specId: string
    specVersion: number
    sources: EvidenceSourceKind[]
    sourceLabel: string | null
    result: CheckResult
  },
): Promise<string> {
  const id = crypto.randomUUID()
  await db.query(
    `insert into checks (id, spec_id, owner_id, spec_version, sources, source_label, result)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      id,
      input.specId,
      input.ownerId,
      input.specVersion,
      input.sources,
      input.sourceLabel,
      JSON.stringify(input.result),
    ],
  )
  return id
}

export async function getCheck(
  db: Db,
  ownerId: string,
  specId: string,
  checkId: string,
): Promise<CheckRecord | null> {
  const [row] = await db.query<Row>(
    `select id, spec_id, spec_version, sources, source_label, result, created_at
       from checks where id = $1 and spec_id = $2 and owner_id = $3`,
    [checkId, specId, ownerId],
  )
  return row ? toRecord(row) : null
}

export async function listChecks(db: Db, ownerId: string, specId: string): Promise<CheckRecord[]> {
  const rows = await db.query<Row>(
    `select id, spec_id, spec_version, sources, source_label, result, created_at
       from checks where spec_id = $1 and owner_id = $2 order by created_at desc limit 20`,
    [specId, ownerId],
  )
  return rows.map(toRecord)
}
