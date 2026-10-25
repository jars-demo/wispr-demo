'use client'

import { AI_HEADERS, type OwnAiKey } from '@/domain/ai'
import type { Breakdown } from '@/domain/breakdown'
import { parseDiff, type ParsedDiff } from '@/domain/diff'
import { sampleById } from '@/domain/samples'
import type { Connection } from '@/features/connect/connection'
import { getCommitDiff, getPullDiff, GitHubError } from '@/features/connect/github'
import { PASTE_KEY } from '@/features/wire/links'

import type { Request } from './source'

// Gets a breakdown for a request: samples locally, everything else from /api/breakdown. Private
// GitHub diffs are fetched here in the browser with the player's token, so the token never leaves.

export type Loaded = {
  breakdown: Breakdown
  diff: ParsedDiff
  dropped: number
  model: string
  repo: string | null
  url: string | null
  label: string
  demo: boolean
}

export class LoadError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message)
  }
}

const CACHE_KEY = 'breakdown:cache:v1'
const CACHE_SIZE = 8

type Cache = Record<string, { at: number; value: Loaded }>

function readCache(): Cache {
  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? '{}') as Cache
  } catch {
    return {}
  }
}

function writeCache(key: string, value: Loaded) {
  const cache = readCache()
  cache[key] = { at: Date.now(), value }
  const keep = Object.entries(cache)
    .sort((a, b) => b[1].at - a[1].at)
    .slice(0, CACHE_SIZE)
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(keep)))
  } catch {
    // Storage full: the breakdown still shows, it just is not kept.
  }
}

export function readPasted(): string | null {
  try {
    return window.sessionStorage.getItem(PASTE_KEY)
  } catch {
    return null
  }
}

async function post(body: unknown, ai: OwnAiKey | null) {
  let response: Response
  try {
    response = await fetch('/api/breakdown', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ai
          ? {
              [AI_HEADERS.provider]: ai.provider,
              [AI_HEADERS.key]: ai.key,
              [AI_HEADERS.model]: ai.model,
            }
          : {}),
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new LoadError(
      'Could not reach Breakdown. Check your connection and try again.',
      'offline',
    )
  }
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as {
      title?: string
      code?: string
    } | null
    throw new LoadError(
      problem?.title ?? 'Something went wrong. Try again.',
      problem?.code ?? 'error',
    )
  }
  return (await response.json()) as Omit<Loaded, 'repo' | 'url' | 'label' | 'demo'>
}

export async function loadBreakdown(
  request: Request,
  key: string,
  options: { github: Connection | null; ai: OwnAiKey | null; fresh?: boolean },
): Promise<Loaded> {
  const { source, only } = request
  const extra = only ? { only: [only] } : {}

  if (source.kind === 'sample' && !only) {
    const sample = sampleById(source.id)
    if (!sample) throw new LoadError('That sample does not exist.', 'not_found')
    return {
      breakdown: sample.breakdown,
      diff: parseDiff(sample.diff),
      dropped: 0,
      model: 'sample',
      repo: sample.item.repo,
      url: null,
      label: sample.item.title,
      demo: true,
    }
  }

  if (!options.fresh) {
    const cached = readCache()[key]
    if (cached) return cached.value
  }

  let result: Omit<Loaded, 'repo' | 'url' | 'label' | 'demo'>
  let repo: string | null = null
  let url: string | null = null
  let label = 'A change'

  if (source.kind === 'sample') {
    const sample = sampleById(source.id)
    if (!sample) throw new LoadError('That sample does not exist.', 'not_found')
    result = await post(
      {
        source: { kind: 'diff', diff: sample.diff, title: sample.item.title, origin: 'mine' },
        ...extra,
      },
      options.ai,
    )
    repo = sample.item.repo
    label = sample.item.title
  } else if (source.kind === 'paste') {
    const diff = readPasted()
    if (!diff)
      throw new LoadError('The pasted diff is gone. Paste it again on the home page.', 'not_found')
    result = await post({ source: { kind: 'diff', diff, title: null }, ...extra }, options.ai)
    label = 'Pasted diff'
  } else if (source.kind === 'github') {
    const gh = options.github
    if (!gh)
      throw new LoadError('Connect GitHub in Settings to break down this change.', 'no_github')
    let diff: string
    try {
      diff =
        'pr' in source
          ? await getPullDiff(gh.token, source.repo, source.pr)
          : await getCommitDiff(gh.token, source.repo, source.sha)
    } catch (error) {
      throw new LoadError(
        error instanceof GitHubError ? error.message : 'Could not load the change.',
        'github',
      )
    }
    label =
      'pr' in source ? `${source.repo} #${source.pr}` : `${source.repo} @ ${source.sha.slice(0, 7)}`
    result = await post(
      { source: { kind: 'diff', diff, title: label, origin: 'mine' }, ...extra },
      options.ai,
    )
    repo = source.repo
    url = `https://github.com/${source.repo}/${'pr' in source ? `pull/${source.pr}` : `commit/${source.sha}`}`
  } else {
    url = source.url
    const parts = /github\.com\/([^/]+\/[^/]+)\/(pull|commit|compare)\/([^/]+)/.exec(source.url)
    repo = parts?.[1] ?? null
    label = parts
      ? `${parts[1]} ${parts[2] === 'pull' ? `#${parts[3]}` : `@ ${parts[3]?.slice(0, 7)}`}`
      : source.url
    // With GitHub connected, fetch in the browser so private repositories work too.
    const gh = options.github
    const pr = parts?.[2] === 'pull' ? Number(parts[3]) : null
    const sha = parts?.[2] === 'commit' ? parts[3] : null
    let diff: string | null = null
    if (gh && repo && (pr || sha)) {
      diff = await (
        pr ? getPullDiff(gh.token, repo, pr) : getCommitDiff(gh.token, repo, sha ?? '')
      ).catch(() => null)
    }
    result = diff
      ? await post(
          { source: { kind: 'diff', diff, title: label, origin: 'theirs' }, ...extra },
          options.ai,
        )
      : await post({ source: { kind: 'link', url: source.url }, ...extra }, options.ai)
  }

  const loaded: Loaded = { ...result, repo, url, label, demo: false }
  writeCache(key, loaded)
  return loaded
}
