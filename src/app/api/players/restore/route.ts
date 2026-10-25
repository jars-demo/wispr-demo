import { z } from 'zod'

import { restoreProfile } from '@/server/board/service'
import { getDb } from '@/server/db'
import { withErrors } from '@/server/http/handler'
import { problem, readJson } from '@/server/http/problem'
import { hitRateLimit } from '@/server/rate-limit'

// POST /api/players/restore: returns the saved profile for a restore link. The secret travels in
// the body (the link keeps it in the URL fragment), so it never lands in server or proxy logs.

const schema = z.object({ id: z.uuid(), secret: z.string().min(20).max(100) })

export const POST = withErrors('players.restore', async (request, { clientKey }) => {
  const { id, secret } = await readJson(request, schema)
  const db = await getDb()
  const gate = await hitRateLimit(db, `restore:${clientKey}`, 30, 3600)
  if (!gate.allowed) return problem(429, 'Too many restore attempts. Try again later.')
  const saved = await restoreProfile(db, id, secret)
  if (!saved) return problem(404, 'That restore link did not match any saved progress.')
  return Response.json(saved, { headers: { 'Cache-Control': 'no-store' } })
})
