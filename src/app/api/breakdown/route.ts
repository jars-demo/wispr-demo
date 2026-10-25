import { connection } from 'next/server'
import { z } from 'zod'

import { ownKeyFrom } from '@/domain/ai'
import { cacheKeyFor, cacheTtlFor, readCached, writeCached } from '@/server/breakdown/cache'
import { BreakdownError, createBreakdown } from '@/server/breakdown/service'
import { getConfig } from '@/server/config'
import { getDb } from '@/server/db'
import { withErrors } from '@/server/http/handler'
import { problem, readJson } from '@/server/http/problem'
import { log } from '@/server/log'
import { fetchGitHubDiff, GitHubFetchError, parseGitHubLink } from '@/server/providers/github'
import { resolveModel } from '@/server/providers/ai'
import { hitRateLimit, peekRateLimit, refundRateLimit } from '@/server/rate-limit'

// POST /api/breakdown: turn a change into a grounded breakdown. The diff comes from a public
// GitHub link (fetched here) or from the browser (a private repo it fetched with its own token, a
// pasted diff, or one part of a bigger change). Diffs and keys are never logged.
// GET /api/breakdown: how many free breakdowns this visitor has left this hour.
//
// What costs a free breakdown: only a fresh AI run on the shared key. Cached public links,
// samples, failed runs and runs on the player's own key do not.

const bodySchema = z.object({
  source: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('link'), url: z.string().max(500) }),
    z.object({
      kind: z.literal('diff'),
      diff: z.string().min(1).max(2_000_000),
      title: z.string().max(300).nullable().optional(),
      origin: z.enum(['mine', 'theirs', 'unknown']).optional(),
    }),
  ]),
  only: z.array(z.string().max(400)).max(40).nullable().optional(),
})

const HOUR = 3600
// Own keys are the player's own bill; this only stops a runaway loop.
const OWN_KEY_PER_HOUR = 120

const quotaKey = (clientKey: string) => `breakdown:${clientKey}`

export const POST = withErrors('breakdown.create', async (request, { requestId, clientKey }) => {
  const body = await readJson(request, bodySchema, 2_500_000)
  const own = ownKeyFrom(request.headers)
  const config = getConfig()
  const db = await getDb()
  const only = body.only?.length ? body.only : null

  let diffText: string
  let title: string | null = null
  let origin: 'mine' | 'theirs' | 'unknown' = 'theirs'
  let cache: { key: string; ttl: number } | null = null
  if (body.source.kind === 'link') {
    const link = parseGitHubLink(body.source.url)
    if (!link) {
      return problem(422, 'Paste a GitHub pull request, commit or compare link.', {
        code: 'bad_link',
      })
    }
    cache = { key: cacheKeyFor(link, only), ttl: cacheTtlFor(link) }
    const cached = await readCached(db, cache.key)
    if (cached) {
      log.info('breakdown.cached', { requestId })
      return Response.json(cached, {
        headers: { 'Cache-Control': 'no-store', 'X-Breakdown-Cache': 'hit' },
      })
    }
    try {
      diffText = await fetchGitHubDiff(link)
    } catch (error) {
      if (error instanceof GitHubFetchError) {
        return problem(422, error.userMessage, { code: 'github_fetch' })
      }
      throw error
    }
    title = `${link.owner}/${link.repo} ${link.path}`
  } else {
    diffText = body.source.diff
    title = body.source.title ?? null
    origin = body.source.origin ?? 'unknown'
  }

  const model = resolveModel(own, config.groq)
  if (!model) {
    return problem(
      503,
      'Live breakdowns are not switched on here yet. Play a sample, or add your own AI key in Settings.',
      { code: 'ai_not_configured' },
    )
  }

  const key = own ? `own:${clientKey}` : quotaKey(clientKey)
  const gate = await hitRateLimit(db, key, own ? OWN_KEY_PER_HOUR : config.breakdownsPerHour, HOUR)
  if (!gate.allowed) {
    return problem(
      429,
      own
        ? 'That is a lot of breakdowns for one hour. Take a breather and try again soon.'
        : `You have used your ${config.breakdownsPerHour} free breakdowns this hour. Add your own AI key in Settings for unlimited breakdowns.`,
      { code: own ? 'rate_limited' : 'free_limit', retryAfterSeconds: gate.retryAfterSeconds },
      { 'Retry-After': String(gate.retryAfterSeconds) },
    )
  }

  const started = performance.now()
  try {
    const result = await createBreakdown(model, {
      diffText,
      title,
      only,
      ownKey: Boolean(own),
      origin,
    })
    if (cache) await writeCached(db, cache.key, result, cache.ttl)
    log.info('breakdown.done', {
      requestId,
      provider: model.provider,
      files: result.diff.files.length,
      skippedFiles: result.diff.skipped.files.length,
      dropped: result.dropped,
      ms: Math.round(performance.now() - started),
    })
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof BreakdownError) {
      // Our failure, not theirs: the visitor gets the free breakdown back.
      await refundRateLimit(db, key, HOUR)
      log.warn('breakdown.failed', { requestId, provider: model.provider, code: error.code })
      const status = error.code === 'busy' ? 429 : error.code === 'empty_diff' ? 422 : 502
      return problem(status, error.userMessage, { code: error.code })
    }
    throw error
  }
})

const quota = withErrors('breakdown.quota', async (_request, { clientKey }) => {
  const config = getConfig()
  const result = await peekRateLimit(
    await getDb(),
    quotaKey(clientKey),
    config.breakdownsPerHour,
    HOUR,
  )
  return Response.json(
    { ...result, live: Boolean(config.groq) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
})

export async function GET(request: Request) {
  await connection()
  return quota(request)
}
