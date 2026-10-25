import { ownerSchema } from '@/domain/shared'
import { getDb } from '@/server/db'
import { withErrors } from '@/server/http/handler'
import { readJson } from '@/server/http/problem'
import { listMyShares } from '@/server/shared/service'

// POST /api/shared/mine: the breakdowns this player made public, so they can make any of them
// private again. The secret travels in the body, never in a URL.

export const POST = withErrors('shared.mine', async (request) => {
  const owner = await readJson(request, ownerSchema)
  const items = await listMyShares(await getDb(), owner)
  return Response.json({ items }, { headers: { 'Cache-Control': 'no-store' } })
})
