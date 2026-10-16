import type { Db } from '@/server/db/types'

// Fixed-window counter in Postgres: one atomic upsert per hit, no extra infrastructure.

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number }

export async function hitRateLimit(
  db: Db,
  key: string,
  limit: number,
  windowSeconds: number,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const windowMs = windowSeconds * 1000
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs)
  const [row] = await db.query<{ count: number }>(
    `insert into rate_limits (key, window_start, count) values ($1, $2, 1)
     on conflict (key, window_start) do update set count = rate_limits.count + 1
     returning count`,
    [key, windowStart],
  )
  const retryAfterSeconds = Math.ceil((windowStart.getTime() + windowMs - now.getTime()) / 1000)
  return { allowed: (row?.count ?? 0) <= limit, retryAfterSeconds }
}
