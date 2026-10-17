import { z } from 'zod'

import { specDraftSchema } from '@/domain/spec'
import { getDb } from '@/server/db'
import { withOwner } from '@/server/http/handler'
import { problem, readJson } from '@/server/http/problem'
import { deleteSpec, getSpec, updateSpec } from '@/server/specs/repository'

const updateSchema = specDraftSchema.extend({ expectedVersion: z.int().min(1) })
const idSchema = z.uuid()

type Context = RouteContext<'/api/specs/[id]'>

const notFound = () => problem(404, 'That receipt does not exist, or it is not yours.')

async function specId(context: Context): Promise<string | null> {
  const { id } = await context.params
  return idSchema.safeParse(id).success ? id : null
}

export const GET = withOwner('specs.get', async (_request, { ownerId }, context: Context) => {
  const id = await specId(context)
  const spec = id ? await getSpec(await getDb(), ownerId, id) : null
  if (!spec) return notFound()
  return Response.json({ spec }, { headers: { 'Cache-Control': 'no-store' } })
})

export const PUT = withOwner('specs.update', async (request, { ownerId }, context: Context) => {
  const id = await specId(context)
  if (!id) return notFound()
  const { expectedVersion, ...draft } = await readJson(request, updateSchema)
  const result = await updateSpec(await getDb(), ownerId, id, expectedVersion, draft)
  if (result.status === 'not_found') return notFound()
  if (result.status === 'conflict') {
    return problem(409, 'This receipt changed in another tab. Reload to see the latest.', {
      currentVersion: result.currentVersion,
    })
  }
  return Response.json({ id, version: result.version })
})

export const DELETE = withOwner('specs.delete', async (_request, { ownerId }, context: Context) => {
  const id = await specId(context)
  if (!id || !(await deleteSpec(await getDb(), ownerId, id))) return notFound()
  return new Response(null, { status: 204 })
})
