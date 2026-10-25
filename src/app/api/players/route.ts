import { z } from 'zod'

import { syncSchema } from '@/domain/board'
import { leaveBoard, syncPlayer } from '@/server/board/service'
import { getDb } from '@/server/db'
import { withErrors } from '@/server/http/handler'
import { problem, readJson } from '@/server/http/problem'
import { hitRateLimit } from '@/server/rate-limit'

// POST /api/players: save this browser's progress (creates the player on first save).
// DELETE /api/players: remove the player and every public event. Both need the player's secret.

export const POST = withErrors('players.sync', async (request, { clientKey }) => {
  const input = await readJson(request, syncSchema, 200_000)
  const db = await getDb()
  const gate = await hitRateLimit(db, `sync:${clientKey}`, 240, 3600)
  if (!gate.allowed) {
    return problem(
      429,
      'Saving too often. Try again soon.',
      {},
      {
        'Retry-After': String(gate.retryAfterSeconds),
      },
    )
  }
  const outcome = await syncPlayer(db, input)
  if (!outcome.ok) {
    const extra =
      outcome.code === 'name_locked'
        ? { code: outcome.code, name: outcome.name, until: outcome.until }
        : outcome.code
          ? { code: outcome.code }
          : {}
    return problem(outcome.status, outcome.reason, extra)
  }
  return Response.json({
    saved: true,
    events: outcome.events,
    renameAfter: outcome.renameAfter,
  })
})

const leaveSchema = z.object({ id: z.uuid(), secret: z.string().min(20).max(100) })

export const DELETE = withErrors('players.leave', async (request) => {
  const { id, secret } = await readJson(request, leaveSchema)
  const removed = await leaveBoard(await getDb(), id, secret)
  if (!removed) return problem(404, 'Player not found.')
  return new Response(null, { status: 204 })
})
