import { connection } from 'next/server'

import { cleanName } from '@/domain/profile'
import { nameAvailable } from '@/server/board/service'
import { getDb } from '@/server/db'
import { withErrors } from '@/server/http/handler'
import { problem } from '@/server/http/problem'
import { hitRateLimit } from '@/server/rate-limit'

// GET /api/players/name?name=<name>: whether a name is free to claim on the board. Answers yes or
// no only; never who holds it. Saving re-checks, so this is a hint for the form, not a lock.

const handler = withErrors('players.name', async (request, { clientKey }) => {
  const name = cleanName(new URL(request.url).searchParams.get('name') ?? '')
  if (!name) return problem(422, 'Pick a name.', { code: 'bad_name' })
  const db = await getDb()
  const gate = await hitRateLimit(db, `name:${clientKey}`, 300, 3600)
  if (!gate.allowed) {
    return problem(
      429,
      'Checking names too often. Try again soon.',
      { code: 'rate_limited' },
      { 'Retry-After': String(gate.retryAfterSeconds) },
    )
  }
  return Response.json(
    { name, available: await nameAvailable(db, name) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
})

export async function GET(request: Request) {
  await connection()
  return handler(request)
}
