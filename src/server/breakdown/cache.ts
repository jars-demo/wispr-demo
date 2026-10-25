import 'server-only'

import type { Db } from '@/server/db'
import type { GitHubLink } from '@/server/providers/github'

import type { BreakdownResult } from './service'

// Breakdowns of public GitHub links, shared by everyone. The second person to open a pull request
// gets it instantly and it does not count against their free hourly breakdowns. Only public code
// is cached; pasted diffs and private repos never are.

const COMMIT_TTL_SECONDS = 30 * 24 * 3600 // a commit never changes
const MOVING_TTL_SECONDS = 6 * 3600 // pull requests and compares can gain new pushes

export function cacheKeyFor(link: GitHubLink, only: readonly string[] | null): string {
  const files = only?.length ? `|${[...only].sort().join(',')}` : ''
  return `gh:${link.owner}/${link.repo}/${link.path}`.toLowerCase().concat(files).slice(0, 600)
}

export function cacheTtlFor(link: GitHubLink): number {
  return link.kind === 'commit' ? COMMIT_TTL_SECONDS : MOVING_TTL_SECONDS
}

export async function readCached(db: Db, key: string): Promise<BreakdownResult | null> {
  const [row] = await db.query<{ result: BreakdownResult | string }>(
    'select result from breakdown_cache where key = $1 and expires_at > now()',
    [key],
  )
  if (!row) return null
  // postgres.js parses jsonb; PGlite may hand back text.
  return typeof row.result === 'string' ? (JSON.parse(row.result) as BreakdownResult) : row.result
}

export async function writeCached(
  db: Db,
  key: string,
  result: BreakdownResult,
  ttlSeconds: number,
): Promise<void> {
  await db.query('delete from breakdown_cache where expires_at < now()')
  await db.query(
    `insert into breakdown_cache (key, result, expires_at)
     values ($1, $2::jsonb, now() + make_interval(secs => $3))
     on conflict (key) do update set result = excluded.result, expires_at = excluded.expires_at,
       created_at = now()`,
    [key, JSON.stringify(result), ttlSeconds],
  )
}
