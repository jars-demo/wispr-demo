import type { Db } from '@/server/db/types'

// Fixed-window counter in Postgres: one atomic upsert per hit, no extra infrastructure.

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number }

function windowStartFor(now: Date, windowSeconds: number): Date {
  const windowMs = windowSeconds * 1000
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs)
}

export async function hitRateLimit(
  db: Db,
  key: string,
  limit: number,
  windowSeconds: number,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const windowMs = windowSeconds * 1000
  const windowStart = windowStartFor(now, windowSeconds)
  const [row] = await db.query<{ count: number }>(
    `insert into rate_limits (key, window_start, count) values ($1, $2, 1)
     on conflict (key, window_start) do update set count = rate_limits.count + 1
     returning count`,
    [key, windowStart],
  )
  const retryAfterSeconds = Math.ceil((windowStart.getTime() + windowMs - now.getTime()) / 1000)
  return { allowed: (row?.count ?? 0) <= limit, retryAfterSeconds }
}

export type Quota = { limit: number; used: number; left: number; resetsInSeconds: number }

/** How much of a limit is used in the current window, without counting a hit. */
export async function peekRateLimit(
  db: Db,
  key: string,
  limit: number,
  windowSeconds: number,
  now: Date = new Date(),
): Promise<Quota> {
  const windowStart = windowStartFor(now, windowSeconds)
  const [row] = await db.query<{ count: number }>(
    'select count from rate_limits where key = $1 and window_start = $2',
    [key, windowStart],
  )
  const used = Math.min(row?.count ?? 0, limit)
  const resetsInSeconds = Math.ceil(
    (windowStart.getTime() + windowSeconds * 1000 - now.getTime()) / 1000,
  )
  return { limit, used, left: limit - used, resetsInSeconds }
}

/** Gives one hit back, for work that failed on our side and should not cost the visitor. */
export async function refundRateLimit(
  db: Db,
  key: string,
  windowSeconds: number,
  now: Date = new Date(),
): Promise<void> {
  await db.query(
    'update rate_limits set count = count - 1 where key = $1 and window_start = $2 and count > 0',
    [key, windowStartFor(now, windowSeconds)],
  )
}
