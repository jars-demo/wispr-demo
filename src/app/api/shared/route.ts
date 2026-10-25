import { connection } from 'next/server'

import { shareSchema, SHARES_PER_DAY } from '@/domain/shared'
import { getDb } from '@/server/db'
import { withErrors } from '@/server/http/handler'
import { problem, readJson } from '@/server/http/problem'
import { hitRateLimit } from '@/server/rate-limit'
import { listShared, shareBreakdown } from '@/server/shared/service'

// GET /api/shared: the newest public breakdowns, one per change, with who shared them.
// POST /api/shared: make one of your breakdowns public. Needs the player's secret, and only works
// for a public GitHub change the server broke down itself (see src/server/shared/service.ts).

export const POST = withErrors('shared.create', async (request, { clientKey }) => {
  const input = await readJson(request, shareSchema)
  const db = await getDb()
  const gate = await hitRateLimit(db, `share:${clientKey}`, SHARES_PER_DAY, 24 * 3600)
  if (!gate.allowed) {
    return problem(
      429,
      'That is a lot of sharing for one day. Try again tomorrow.',
      { code: 'rate_limited', retryAfterSeconds: gate.retryAfterSeconds },
      { 'Retry-After': String(gate.retryAfterSeconds) },
    )
  }
  const outcome = await shareBreakdown(db, input)
  if (!outcome.ok) return problem(outcome.status, outcome.reason, { code: outcome.code })
  return Response.json(
    { id: outcome.id, created: outcome.created },
    { status: outcome.created ? 201 : 200 },
  )
})

const list = withErrors('shared.list', async () => {
  const items = await listShared(await getDb())
  return Response.json({ items }, { headers: { 'Cache-Control': 'no-store' } })
})

export async function GET(request: Request) {
  await connection()
  return list(request)
}
