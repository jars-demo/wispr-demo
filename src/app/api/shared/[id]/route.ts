import { connection } from 'next/server'
import { z } from 'zod'

import { ownerSchema } from '@/domain/shared'
import { getDb } from '@/server/db'
import { withErrors } from '@/server/http/handler'
import { problem, readJson } from '@/server/http/problem'
import { loadShare, unshareBreakdown } from '@/server/shared/service'

// GET /api/shared/<id>: one shared breakdown to play. Free: no AI call, no hourly limit.
// DELETE /api/shared/<id>: make it private again. Needs the owner's secret; another player's
// share behaves exactly like a missing one.

type Context = RouteContext<'/api/shared/[id]'>

const NOT_FOUND = 'That shared breakdown is gone. Its owner may have made it private.'

const read = withErrors('shared.get', async (_request, _context, ctx: Context) => {
  const { id } = await ctx.params
  if (!z.uuid().safeParse(id).success) return problem(404, NOT_FOUND, { code: 'not_found' })
  const share = await loadShare(await getDb(), id)
  if (!share) return problem(404, NOT_FOUND, { code: 'not_found' })
  return Response.json(share, { headers: { 'Cache-Control': 'no-store' } })
})

export async function GET(request: Request, ctx: Context) {
  await connection()
  return read(request, ctx)
}

export const DELETE = withErrors('shared.delete', async (request, _context, ctx: Context) => {
  const { id } = await ctx.params
  const owner = await readJson(request, ownerSchema)
  const removed =
    z.uuid().safeParse(id).success && (await unshareBreakdown(await getDb(), id, owner))
  if (!removed) return problem(404, NOT_FOUND, { code: 'not_found' })
  return new Response(null, { status: 204 })
})
