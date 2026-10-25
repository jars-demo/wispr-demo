import 'server-only'

import type { Db } from '@/server/db'
import { hitRateLimit, peekRateLimit, refundRateLimit, type Quota } from '@/server/rate-limit'

// Free AI breakdowns on the shared key. Each browser gets a few an hour (counted by its random
// visitor id), and each network has a higher ceiling, so a crowd on one WiFi all get theirs while
// one person minting new ids still hits the network cap. A request without a visitor id is
// counted per network at the per-browser rate.

const HOUR = 3600

export type FreeLimits = { perVisitor: number; perNetwork: number }
export type FreeKeys = { visitor: string | null; network: string }

export type FreeTake =
  { ok: true } | { ok: false; code: 'free_limit' | 'network_limit'; retryAfterSeconds: number }

export function freeKeys(visitor: string | null, clientKey: string): FreeKeys {
  return { visitor: visitor ? `breakdown:v:${visitor}` : null, network: `breakdown:${clientKey}` }
}

const networkLimit = (keys: FreeKeys, limits: FreeLimits) =>
  keys.visitor ? limits.perNetwork : limits.perVisitor

export async function takeFreeBreakdown(
  db: Db,
  keys: FreeKeys,
  limits: FreeLimits,
): Promise<FreeTake> {
  if (keys.visitor) {
    const mine = await hitRateLimit(db, keys.visitor, limits.perVisitor, HOUR)
    if (!mine.allowed) {
      return { ok: false, code: 'free_limit', retryAfterSeconds: mine.retryAfterSeconds }
    }
  }
  const network = await hitRateLimit(db, keys.network, networkLimit(keys, limits), HOUR)
  if (!network.allowed) {
    // The browser still has its own; give it back.
    if (keys.visitor) await refundRateLimit(db, keys.visitor, HOUR)
    return {
      ok: false,
      code: keys.visitor ? 'network_limit' : 'free_limit',
      retryAfterSeconds: network.retryAfterSeconds,
    }
  }
  return { ok: true }
}

/** For work that failed on our side: the visitor and the network get their breakdown back. */
export async function refundFreeBreakdown(db: Db, keys: FreeKeys): Promise<void> {
  if (keys.visitor) await refundRateLimit(db, keys.visitor, HOUR)
  await refundRateLimit(db, keys.network, HOUR)
}

/** What this browser can still use, which is also capped by what its network has left. */
export async function peekFreeBreakdowns(
  db: Db,
  keys: FreeKeys,
  limits: FreeLimits,
): Promise<Quota> {
  const network = await peekRateLimit(db, keys.network, networkLimit(keys, limits), HOUR)
  if (!keys.visitor) return network
  const mine = await peekRateLimit(db, keys.visitor, limits.perVisitor, HOUR)
  const left = Math.min(mine.left, network.left)
  const resetsInSeconds = network.left < mine.left ? network.resetsInSeconds : mine.resetsInSeconds
  return { limit: limits.perVisitor, used: limits.perVisitor - left, left, resetsInSeconds }
}
