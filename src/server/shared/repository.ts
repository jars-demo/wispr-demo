import 'server-only'

import type { MyShare, SharedItem } from '@/domain/shared'
import type { BreakdownResult } from '@/server/breakdown/service'
import type { Db } from '@/server/db'

// Shared breakdown SQL. Writes are scoped to the owner's (id, secret_hash), like every player
// write: another player's share behaves exactly like a missing one. Reads are public but return
// names and avatars only, never player ids.

export type NewShare = {
  id: string
  playerId: string
  sourceKey: string
  url: string
  only: string | null
  repo: string
  title: string
  result: BreakdownResult
}

/** The owner's existing share of this change, if any. */
export async function findOwnShareId(
  db: Db,
  playerId: string,
  sourceKey: string,
): Promise<string | null> {
  const [row] = await db.query<{ id: string }>(
    'select id from shared_breakdowns where player_id = $1 and source_key = $2',
    [playerId, sourceKey],
  )
  return row?.id ?? null
}

export async function insertShare(db: Db, share: NewShare): Promise<void> {
  await db.query(
    `insert into shared_breakdowns (id, player_id, source_key, url, only_path, repo, title, result)
     values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
    [
      share.id,
      share.playerId,
      share.sourceKey,
      share.url,
      share.only,
      share.repo,
      share.title,
      JSON.stringify(share.result),
    ],
  )
}

/** Refreshes the frozen copy when a player shares the same change again. */
export async function refreshShare(db: Db, id: string, result: BreakdownResult, title: string) {
  await db.query('update shared_breakdowns set result = $2::jsonb, title = $3 where id = $1', [
    id,
    JSON.stringify(result),
    title,
  ])
}

export async function deleteOwnShare(
  db: Db,
  shareId: string,
  playerId: string,
  secretHash: string,
): Promise<boolean> {
  const rows = await db.query(
    `delete from shared_breakdowns s using players p
     where s.id = $1 and s.player_id = p.id and p.id = $2 and p.secret_hash = $3
     returning 1`,
    [shareId, playerId, secretHash],
  )
  if (!rows.length) return false
  // Its line in the live feed goes with it.
  await db.query("delete from player_events where kind = 'shared' and detail = $1", [shareId])
  return true
}

type ItemRow = {
  id: string
  name: string
  avatar: string
  repo: string
  title: string
  url: string
  only_path: string | null
  created_at: Date | string
}

const at = (value: Date | string) => new Date(value).toISOString()

/** The newest shares, one per change, with how many players shared it. */
export async function recentShares(db: Db, limit = 30): Promise<SharedItem[]> {
  const rows = await db.query<ItemRow & { sharers: number }>(
    `with latest as (
       select distinct on (s.source_key) s.id, s.source_key, s.repo, s.title, s.url, s.only_path,
         s.created_at, p.name, p.avatar
       from shared_breakdowns s join players p on p.id = s.player_id
       order by s.source_key, s.created_at desc
     )
     select l.id, l.repo, l.title, l.url, l.only_path, l.created_at, l.name, l.avatar,
       (select count(*)::int from shared_breakdowns x where x.source_key = l.source_key) as sharers
     from latest l order by l.created_at desc limit $1`,
    [limit],
  )
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    avatar: r.avatar,
    repo: r.repo,
    title: r.title,
    url: r.url,
    only: r.only_path,
    at: at(r.created_at),
    sharers: r.sharers,
  }))
}

export type SharedRecord = {
  result: BreakdownResult
  url: string
  repo: string
  only: string | null
  title: string
  by: { name: string; avatar: string }
  at: string
}

export async function findShare(db: Db, id: string): Promise<SharedRecord | null> {
  const [row] = await db.query<ItemRow & { result: BreakdownResult | string }>(
    `select s.id, s.repo, s.title, s.url, s.only_path, s.created_at, s.result, p.name, p.avatar
     from shared_breakdowns s join players p on p.id = s.player_id where s.id = $1`,
    [id],
  )
  if (!row) return null
  return {
    // postgres.js parses jsonb; PGlite may hand back text.
    result:
      typeof row.result === 'string' ? (JSON.parse(row.result) as BreakdownResult) : row.result,
    url: row.url,
    repo: row.repo,
    only: row.only_path,
    title: row.title,
    by: { name: row.name, avatar: row.avatar },
    at: at(row.created_at),
  }
}

export async function ownShares(db: Db, playerId: string, secretHash: string): Promise<MyShare[]> {
  const rows = await db.query<Omit<ItemRow, 'name' | 'avatar'>>(
    `select s.id, s.repo, s.title, s.url, s.only_path, s.created_at
     from shared_breakdowns s join players p on p.id = s.player_id
     where p.id = $1 and p.secret_hash = $2
     order by s.created_at desc limit 100`,
    [playerId, secretHash],
  )
  return rows.map((r) => ({
    id: r.id,
    repo: r.repo,
    title: r.title,
    url: r.url,
    only: r.only_path,
    at: at(r.created_at),
  }))
}
