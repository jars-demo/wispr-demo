import { z } from 'zod'

import { runFullCheck } from '@/server/checks/run'
import type { EvidenceSourceKind } from '@/domain/evidence-source'
import { createCheck } from '@/server/checks/repository'
import { getDb } from '@/server/db'
import { withOwner } from '@/server/http/handler'
import { problem, readJson } from '@/server/http/problem'
import {
  fetchGitHubDiff,
  GitHubFetchError,
  MAX_DIFF_BYTES,
  parseGitHubLink,
} from '@/server/providers/github'
import { hitRateLimit } from '@/server/rate-limit'
import { getSpec } from '@/server/specs/repository'

// Runs a check of the agent's work against the current version of a checklist and stores it.

const bodySchema = z
  .object({
    diff: z.string().max(MAX_DIFF_BYTES).default(''),
    link: z.string().trim().max(500).default(''),
    summary: z.string().max(20_000).default(''),
    testOutput: z.string().max(100_000).default(''),
  })
  .refine((body) => body.diff.trim() !== '' || body.link !== '', {
    message: 'Paste the changes or a GitHub link.',
    path: ['diff'],
  })

type Context = RouteContext<'/api/specs/[id]/checks'>

export const POST = withOwner('checks.create', async (request, { ownerId }, context: Context) => {
  const { id } = await context.params
  if (!z.uuid().safeParse(id).success) return problem(404, 'That checklist does not exist.')
  const body = await readJson(request, bodySchema, 600_000)

  const db = await getDb()
  const limit = await hitRateLimit(db, `checks:${ownerId}`, 60, 3600)
  if (!limit.allowed) {
    return problem(
      429,
      'That is a lot of checks for one hour. Try again shortly.',
      {},
      { 'Retry-After': String(limit.retryAfterSeconds) },
    )
  }

  const spec = await getSpec(db, ownerId, id)
  if (!spec) return problem(404, 'That checklist does not exist, or it is not yours.')

  let diff = body.diff
  const sources: EvidenceSourceKind[] = []
  let sourceLabel: string | null = null
  if (body.link) {
    const link = parseGitHubLink(body.link)
    if (!link) {
      return problem(422, 'Use a public GitHub pull request, compare or commit link.', {
        errors: [{ path: 'link', message: 'Not a supported GitHub link.' }],
      })
    }
    try {
      diff = await fetchGitHubDiff(link)
    } catch (error) {
      if (error instanceof GitHubFetchError) return problem(422, error.userMessage)
      throw error
    }
    sources.push(link.kind === 'pull' ? 'github_pull_request' : 'github_compare')
    sourceLabel = `${link.owner}/${link.repo} ${link.path.replace('pull/', '#')}`
  } else {
    sources.push('pasted_diff')
  }
  if (body.summary.trim()) sources.push('agent_summary')
  if (body.testOutput.trim()) sources.push('test_output')

  const result = await runFullCheck({
    items: spec.items,
    diff,
    summary: body.summary,
    testOutput: body.testOutput,
  })
  if (result.files.length === 0 && result.skipped.length === 0) {
    return problem(422, 'That does not look like a diff. Paste the output of git diff.', {
      errors: [{ path: 'diff', message: 'No changed files found.' }],
    })
  }

  const checkId = await createCheck(db, {
    ownerId,
    specId: spec.id,
    specVersion: spec.version,
    sources,
    sourceLabel,
    result,
  })
  return Response.json({ id: checkId }, { status: 201 })
})
