import { connection } from 'next/server'
import { z } from 'zod'

import { loadBoard } from '@/server/board/service'
import { getDb } from '@/server/db'
import { withErrors } from '@/server/http/handler'

// GET /api/board?me=<player id>: the public leaderboard, the live event ticker, and where the
// given player stands. Returns names, avatars and numbers only; never ids.

const handler = withErrors('board.get', async (request) => {
  const me = new URL(request.url).searchParams.get('me')
  const meId = me && z.uuid().safeParse(me).success ? me : null
  const board = await loadBoard(await getDb(), meId)
  return Response.json(board, { headers: { 'Cache-Control': 'no-store' } })
})

// Always live. connection() runs outside the error wrapper, so its prerender bail-out is not
// mistaken for a failure.
export async function GET(request: Request) {
  await connection()
  return handler(request)
}
