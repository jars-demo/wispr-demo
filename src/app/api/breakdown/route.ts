import { connection } from 'next/server'
import { z } from 'zod'

import { ownKeyFrom } from '@/domain/ai'
import { visitorFrom } from '@/domain/visitor'
import { cacheKeyFor, cacheTtlFor, readCached, writeCached } from '@/server/breakdown/cache'
import {
  freeKeys,
  peekFreeBreakdowns,
  refundFreeBreakdown,
  takeFreeBreakdown,
} from '@/server/breakdown/free-quota'
import { BreakdownError, createBreakdown } from '@/server/breakdown/service'
import { getConfig } from '@/server/config'
import { getDb } from '@/server/db'
import { withErrors } from '@/server/http/handler'
import { problem, readJson } from '@/server/http/problem'
import { log } from '@/server/log'
import { fetchGitHubDiff, GitHubFetchError, parseGitHubLink } from '@/server/providers/github'
import { resolveModel } from '@/server/providers/ai'
import { hitRateLimit, refundRateLimit } from '@/server/rate-limit'

// POST /api/breakdown: turn a change into a grounded breakdown. The diff comes from a public
// GitHub link (fetched here) or from the browser (a private repo it fetched with its own token, a
// pasted diff, or one part of a bigger change). Diffs and keys are never logged.
// GET /api/breakdown: how many free breakdowns this visitor has left this hour.
//
// What costs a free breakdown: only a fresh AI run on the shared key, counted per browser with a
// ceiling per network (src/server/breakdown/free-quota.ts). Cached public links, samples, shared
// breakdowns, failed runs and runs on the player's own key do not.

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

const limitsFrom = (config: ReturnType<typeof getConfig>) => ({
  perVisitor: config.breakdownsPerHour,
  perNetwork: config.breakdownsPerNetworkPerHour,
})

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

  const ownKey = `own:${clientKey}`
  const free = freeKeys(visitorFrom(request.headers), clientKey)
  const gate = own
    ? await hitRateLimit(db, ownKey, OWN_KEY_PER_HOUR, HOUR).then((hit) =>
        hit.allowed
          ? ({ ok: true } as const)
          : ({
              ok: false,
              code: 'rate_limited',
              retryAfterSeconds: hit.retryAfterSeconds,
            } as const),
      )
    : await takeFreeBreakdown(db, free, limitsFrom(config))
  if (!gate.ok) {
    const message =
      gate.code === 'free_limit'
        ? `You have used your ${config.breakdownsPerHour} free breakdowns this hour. Add your own AI key in Settings for unlimited breakdowns.`
        : gate.code === 'network_limit'
          ? 'Lots of people on your network are breaking things down right now. Add your own AI key in Settings, or try again soon.'
          : 'That is a lot of breakdowns for one hour. Take a breather and try again soon.'
    return problem(
      429,
      message,
      { code: gate.code, retryAfterSeconds: gate.retryAfterSeconds },
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
      if (own) await refundRateLimit(db, ownKey, HOUR)
      else await refundFreeBreakdown(db, free)
      log.warn('breakdown.failed', { requestId, provider: model.provider, code: error.code })
      const status = error.code === 'busy' ? 429 : error.code === 'empty_diff' ? 422 : 502
      return problem(status, error.userMessage, { code: error.code })
    }
    throw error
  }
})

const quota = withErrors('breakdown.quota', async (request, { clientKey }) => {
  const config = getConfig()
  const result = await peekFreeBreakdowns(
    await getDb(),
    freeKeys(visitorFrom(request.headers), clientKey),
    limitsFrom(config),
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
