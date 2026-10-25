import 'server-only'

import type { BoardEvent, BoardEventKind, PlayerState } from '@/domain/board'
import type { Db } from '@/server/db'

// Leaderboard SQL. Writes are scoped to (id, secret_hash): a player can only change or delete
// the row their browser holds the secret for. Reads are public but never return ids or hashes.

type PlayerRow = {
  name: string
  avatar: string
  xp: number
  breakdowns: number
  concepts: number
  achievements: string[]
  avatars: string[]
  hidden: boolean
}

const STATE_COLUMNS = 'name, avatar, xp, breakdowns, concepts, achievements, avatars, hidden'

function toState(row: PlayerRow): PlayerState {
  return {
    name: row.name,
    avatar: row.avatar,
    xp: row.xp,
    breakdowns: row.breakdowns,
    concepts: row.concepts,
    achievements: row.achievements,
    avatars: row.avatars,
    hidden: row.hidden,
  }
}

export async function findOwnPlayer(
  db: Db,
  id: string,
  secretHash: string,
): Promise<PlayerState | null> {
  const [row] = await db.query<PlayerRow>(
    `select ${STATE_COLUMNS} from players where id = $1 and secret_hash = $2`,
    [id, secretHash],
  )
  return row ? toState(row) : null
}

export async function playerExists(db: Db, id: string): Promise<boolean> {
  const rows = await db.query('select 1 from players where id = $1', [id])
  return rows.length > 0
}

function stateParams(id: string, secretHash: string, s: PlayerState, profile: unknown) {
  return [
    id,
    secretHash,
    s.name,
    s.avatar,
    s.xp,
    s.breakdowns,
    s.concepts,
    s.achievements,
    s.avatars,
    s.hidden,
    JSON.stringify(profile),
  ]
}

export async function insertPlayer(
  db: Db,
  id: string,
  secretHash: string,
  s: PlayerState,
  profile: unknown,
) {
  await db.query(
    `insert into players
       (id, secret_hash, name, avatar, xp, breakdowns, concepts, achievements, avatars, hidden, profile)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)`,
    stateParams(id, secretHash, s, profile),
  )
}

export async function updateOwnPlayer(
  db: Db,
  id: string,
  secretHash: string,
  s: PlayerState,
  profile: unknown,
) {
  await db.query(
    `update players set name = $3, avatar = $4, xp = $5, breakdowns = $6, concepts = $7,
       achievements = $8, avatars = $9, hidden = $10, profile = $11::jsonb, updated_at = now()
     where id = $1 and secret_hash = $2`,
    stateParams(id, secretHash, s, profile),
  )
}

/** The saved profile for a restore link, only with the matching secret. */
export async function findOwnProfile(
  db: Db,
  id: string,
  secretHash: string,
): Promise<{ profile: unknown; hidden: boolean } | null> {
  const [row] = await db.query<{ profile: unknown; hidden: boolean }>(
    'select profile, hidden from players where id = $1 and secret_hash = $2',
    [id, secretHash],
  )
  return row ? { profile: row.profile, hidden: row.hidden } : null
}

export async function insertEvents(db: Db, playerId: string, events: readonly BoardEvent[]) {
  for (const event of events) {
    await db.query('insert into player_events (player_id, kind, detail) values ($1, $2, $3)', [
      playerId,
      event.kind,
      event.detail,
    ])
  }
}

export async function deleteOwnPlayer(db: Db, id: string, secretHash: string): Promise<boolean> {
  const rows = await db.query(
    'delete from players where id = $1 and secret_hash = $2 returning 1',
    [id, secretHash],
  )
  return rows.length > 0
}

export type BoardRow = {
  name: string
  avatar: string
  xp: number
  breakdowns: number
  isMe: boolean
}

export async function topPlayers(db: Db, meId: string | null, limit = 10): Promise<BoardRow[]> {
  const rows = await db.query<{
    name: string
    avatar: string
    xp: number
    breakdowns: number
    is_me: boolean
  }>(
    `select name, avatar, xp, breakdowns, (id = $1::uuid) is true as is_me
     from players where not hidden or id = $1::uuid
     order by xp desc, updated_at asc limit $2`,
    [meId, limit],
  )
  return rows.map((r) => ({ ...r, isMe: r.is_me }))
}

export async function standing(
  db: Db,
  meId: string,
): Promise<{
  me: { xp: number; rank: number }
  ahead: { name: string; xp: number } | null
} | null> {
  const [me] = await db.query<{ xp: number; updated_at: Date }>(
    'select xp, updated_at from players where id = $1',
    [meId],
  )
  if (!me) return null
  // Ties rank by who got there first, matching the board order.
  const [rank] = await db.query<{ rank: number }>(
    `select count(*)::int + 1 as rank from players
     where not hidden and (xp > $1 or (xp = $1 and updated_at < $2))`,
    [me.xp, me.updated_at],
  )
  const [ahead] = await db.query<{ name: string; xp: number }>(
    `select name, xp from players
     where id <> $3 and not hidden and (xp > $1 or (xp = $1 and updated_at < $2))
     order by xp asc, updated_at desc limit 1`,
    [me.xp, me.updated_at, meId],
  )
  return { me: { xp: me.xp, rank: rank?.rank ?? 1 }, ahead: ahead ?? null }
}

export type EventRow = {
  kind: BoardEventKind
  detail: string
  name: string
  avatar: string
  at: string
}

export async function recentEvents(db: Db, limit = 15): Promise<EventRow[]> {
  const rows = await db.query<{
    kind: BoardEventKind
    detail: string
    name: string
    avatar: string
    created_at: Date | string
  }>(
    `select e.kind, e.detail, p.name, p.avatar, e.created_at
     from player_events e join players p on p.id = e.player_id
     where not p.hidden
     order by e.created_at desc, e.id desc limit $1`,
    [limit],
  )
  return rows.map((r) => ({
    kind: r.kind,
    detail: r.detail,
    name: r.name,
    avatar: r.avatar,
    at: new Date(r.created_at).toISOString(),
  }))
}

export async function countPlayers(db: Db): Promise<number> {
  const [row] = await db.query<{ n: number }>(
    'select count(*)::int as n from players where not hidden',
  )
  return row?.n ?? 0
}
