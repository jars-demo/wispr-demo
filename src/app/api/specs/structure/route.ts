import { transcriptSchema } from '@/domain/spec'
import { getDb } from '@/server/db'
import { withOwner } from '@/server/http/handler'
import { problem, readJson } from '@/server/http/problem'
import { hitRateLimit } from '@/server/rate-limit'
import { getModelStructurer } from '@/server/specs/model'
import { structureTranscript } from '@/server/specs/structure'

// Turns a transcript into a draft receipt. Nothing is saved here.

export const POST = withOwner('specs.structure', async (request, { ownerId }) => {
  const { transcript } = await readJson(request, transcriptSchema)
  const limit = await hitRateLimit(await getDb(), `structure:${ownerId}`, 30, 3600)
  if (!limit.allowed) {
    return problem(
      429,
      'You have made a lot of receipts this hour. Try again shortly.',
      {},
      { 'Retry-After': String(limit.retryAfterSeconds) },
    )
  }
  const result = await structureTranscript(transcript, getModelStructurer())
  return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
})
