import { z } from 'zod'

import { isAgentId } from '@/domain/agent-handoff'
import { getDb } from '@/server/db'
import { withOwner } from '@/server/http/handler'
import { problem, readJson } from '@/server/http/problem'
import { markSent } from '@/server/specs/repository'

// Records that a receipt was handed to an agent, and where (a GitHub issue link when there is one).

const GITHUB_REF = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/(issues|pull)\/\d+$/

const bodySchema = z.object({
  via: z.string().refine(isAgentId, 'Unknown agent.'),
  ref: z
    .string()
    .trim()
    .max(300)
    .regex(GITHUB_REF, 'Only GitHub issue or pull request links.')
    .nullish(),
})

type Context = RouteContext<'/api/specs/[id]/sent'>

export const POST = withOwner('specs.sent', async (request, { ownerId }, context: Context) => {
  const { id } = await context.params
  const notFound = () => problem(404, 'That receipt does not exist, or it is not yours.')
  if (!z.uuid().safeParse(id).success) return notFound()
  const { via, ref } = await readJson(request, bodySchema)
  const sentAt = await markSent(await getDb(), ownerId, id, via, ref ?? null)
  if (!sentAt) return notFound()
  return Response.json({ sentAt })
})
