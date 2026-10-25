'use client'

import { AI_HEADERS, type OwnAiKey } from '@/domain/ai'
import type { Breakdown } from '@/domain/breakdown'
import { changeLabel } from '@/domain/shared'
import { parseDiff, type ParsedDiff } from '@/domain/diff'
import { sampleById } from '@/domain/samples'
import type { Connection } from '@/features/connect/connection'
import { getCommitDiff, getPullDiff, GitHubError } from '@/features/connect/github'
import { PASTE_KEY } from '@/features/wire/links'

import { refreshQuota } from './quota'
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
  /** The public GitHub link the server broke this down from, so it can be shared. */
  shareUrl?: string | null
  /** Who made this breakdown public, when playing someone's shared one. */
  sharedBy?: { name: string; avatar: string } | null
}

export class LoadError extends Error {
  constructor(
    message: string,
    readonly code: string,
    /** Seconds until a limit resets, when the server said so. */
    readonly retryAfter: number | null = null,
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
      retryAfterSeconds?: number
    } | null
    throw new LoadError(
      problem?.title ?? 'Something went wrong. Try again.',
      problem?.code ?? 'error',
      problem?.retryAfterSeconds ?? null,
    )
  }
  // A fresh AI run used one free breakdown; a cached public link did not.
  if (response.headers.get('X-Breakdown-Cache') !== 'hit') void refreshQuota()
  return (await response.json()) as Result
}

type Result = Omit<Loaded, 'repo' | 'url' | 'label' | 'demo'>

/**
 * Public changes go through the server first: the result is cached for everyone and can be
 * shared. Returns null when GitHub will not serve the change publicly (a private repository),
 * so the caller can fetch it in the browser with the player's own token instead.
 */
async function postPublic(url: string, extra: object, ai: OwnAiKey | null): Promise<Result | null> {
  try {
    return await post({ source: { kind: 'link', url }, ...extra }, ai)
  } catch (error) {
    if (error instanceof LoadError && error.code === 'github_fetch') return null
    throw error
  }
}

async function loadShared(id: string): Promise<Loaded> {
  let response: Response
  try {
    response = await fetch(`/api/shared/${encodeURIComponent(id)}`, { cache: 'no-store' })
  } catch {
    throw new LoadError(
      'Could not reach Breakdown. Check your connection and try again.',
      'offline',
    )
  }
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { title?: string } | null
    throw new LoadError(problem?.title ?? 'That shared breakdown is gone.', 'not_found')
  }
  const share = (await response.json()) as {
    result: Result
    url: string
    repo: string
    by: { name: string; avatar: string }
  }
  return {
    ...share.result,
    repo: share.repo,
    url: share.url,
    label: changeLabel(share.url),
    demo: false,
    shareUrl: null,
    sharedBy: share.by,
  }
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

  // Shared breakdowns are always read fresh: their owner can make them private at any time.
  if (source.kind === 'shared') return loadShared(source.id)

  if (!options.fresh) {
    const cached = readCache()[key]
    if (cached) return cached.value
  }

  let result: Result
  let repo: string | null = null
  let url: string | null = null
  let shareUrl: string | null = null
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
  } else {
    // A GitHub change, from the player's feed or a pasted link.
    if (source.kind === 'github') {
      repo = source.repo
      url = `https://github.com/${source.repo}/${'pr' in source ? `pull/${source.pr}` : `commit/${source.sha}`}`
    } else {
      url = source.url
    }
    const parts = /github\.com\/([^/]+\/[^/]+)\/(pull|commit|compare)\/([^/]+)/.exec(url)
    repo = parts?.[1] ?? repo
    label = changeLabel(url)
    const pr = parts?.[2] === 'pull' ? Number(parts[3]) : null
    const sha = parts?.[2] === 'commit' ? (parts[3] ?? null) : null

    const open = await postPublic(url, extra, options.ai)
    if (open) {
      result = open
      shareUrl = url
    } else {
      // Not public: fetch it here with the player's token, so private code stays private.
      const gh = options.github
      if (!gh || !repo || !(pr || sha)) {
        throw new LoadError(
          gh
            ? 'GitHub would not share this change. Check the link.'
            : 'This change is not public. Connect GitHub in Settings to break down private repositories.',
          gh ? 'github' : 'no_github',
        )
      }
      let diff: string
      try {
        diff = pr
          ? await getPullDiff(gh.token, repo, pr)
          : await getCommitDiff(gh.token, repo, sha ?? '')
      } catch (error) {
        throw new LoadError(
          error instanceof GitHubError ? error.message : 'Could not load the change.',
          'github',
        )
      }
      result = await post(
        {
          source: {
            kind: 'diff',
            diff,
            title: label,
            origin: source.kind === 'github' ? 'mine' : 'theirs',
          },
          ...extra,
        },
        options.ai,
      )
    }
  }

  const loaded: Loaded = { ...result, repo, url, label, demo: false, shareUrl }
  writeCache(key, loaded)
  return loaded
}
