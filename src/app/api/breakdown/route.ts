import { z } from 'zod'

import { ownKeyFrom } from '@/domain/ai'
import { BreakdownError, createBreakdown } from '@/server/breakdown/service'
import { getConfig } from '@/server/config'
import { getDb } from '@/server/db'
import { withErrors } from '@/server/http/handler'
import { problem, readJson } from '@/server/http/problem'
import { log } from '@/server/log'
import { fetchGitHubDiff, GitHubFetchError, parseGitHubLink } from '@/server/providers/github'
import { resolveModel } from '@/server/providers/ai'
import { hitRateLimit } from '@/server/rate-limit'

// POST /api/breakdown: turn a change into a grounded breakdown. The diff comes from a public
// GitHub link (fetched here) or from the browser (a private repo it fetched with its own token, a
// pasted diff, or one part of a bigger change). Diffs and keys are never logged or stored.

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

const OWN_KEY_PER_HOUR = 120

export const POST = withErrors('breakdown.create', async (request, { requestId, clientKey }) => {
  const body = await readJson(request, bodySchema, 2_500_000)
  const own = ownKeyFrom(request.headers)
  const config = getConfig()
  const model = resolveModel(own, config.groq)
  if (!model) {
    return problem(
      503,
      'AI breakdowns are not set up here yet. Try a sample, or add your own AI key in Settings.',
      {
        code: 'ai_not_configured',
      },
    )
  }

  const limit = own ? OWN_KEY_PER_HOUR : config.breakdownsPerHour
  const gate = await hitRateLimit(await getDb(), `breakdown:${clientKey}`, limit, 3600)
  if (!gate.allowed) {
    return problem(
      429,
      own
        ? 'That is a lot of breakdowns in an hour. Take a breather and try again soon.'
        : 'You have used this hour of free breakdowns. Add your own AI key in Settings to keep going.',
      { code: 'rate_limited' },
      { 'Retry-After': String(gate.retryAfterSeconds) },
    )
  }

  let diffText: string
  let title: string | null = null
  let origin: 'mine' | 'theirs' | 'unknown' = 'theirs'
  if (body.source.kind === 'link') {
    const link = parseGitHubLink(body.source.url)
    if (!link) {
      return problem(422, 'Paste a GitHub pull request, commit or compare link.', {
        code: 'bad_link',
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

  const started = performance.now()
  try {
    const result = await createBreakdown(model, {
      diffText,
      title,
      only: body.only?.length ? body.only : null,
      ownKey: Boolean(own),
      origin,
    })
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
      log.warn('breakdown.failed', { requestId, provider: model.provider, code: error.code })
      const status = error.code === 'busy' ? 429 : error.code === 'empty_diff' ? 422 : 502
      return problem(status, error.userMessage, { code: error.code })
    }
    throw error
  }
})
