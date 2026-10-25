import { isRepoName, parseChangeLink } from '@/domain/feed'
import type { RunSource } from '@/domain/profile'

// What the breakdown page was asked to break down, read from its URL.

export type Source =
  | { kind: 'sample'; id: string }
  | { kind: 'link'; url: string }
  | { kind: 'github'; repo: string; pr: number }
  | { kind: 'github'; repo: string; sha: string }
  | { kind: 'paste' }
  | { kind: 'shared'; id: string }

export type Request = { source: Source; only: string | null }

export function readRequest(params: { get(name: string): string | null }): Request | null {
  const only = params.get('only')
  const sample = params.get('sample')
  if (sample) return { source: { kind: 'sample', id: sample }, only }
  const shared = params.get('shared')
  if (shared && /^[0-9a-f-]{36}$/i.test(shared))
    return { source: { kind: 'shared', id: shared }, only }
  const url = params.get('url')
  if (url) {
    const link = parseChangeLink(url)
    return link ? { source: { kind: 'link', url: link.url }, only } : null
  }
  const repo = params.get('repo')
  if (repo && isRepoName(repo)) {
    const pr = Number(params.get('pr'))
    if (Number.isInteger(pr) && pr > 0) return { source: { kind: 'github', repo, pr }, only }
    const sha = params.get('sha')
    if (sha && /^[0-9a-f]{7,40}$/i.test(sha)) return { source: { kind: 'github', repo, sha }, only }
  }
  if (params.get('paste')) return { source: { kind: 'paste' }, only }
  return null
}

function hash(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/** The run key: the same change always maps to the same key, matching feed item ids. */
export function runKey(request: Request, pasted: string | null): string {
  const s = request.source
  const base =
    s.kind === 'sample'
      ? `sample:${s.id}`
      : s.kind === 'link'
        ? `link:${s.url}`
        : s.kind === 'paste'
          ? `paste:${hash(pasted ?? '')}`
          : s.kind === 'shared'
            ? `shared:${s.id}`
            : 'pr' in s
              ? `gh:${s.repo}#${s.pr}`
              : `gh:${s.repo}@${s.sha}`
  return request.only ? `${base}::${request.only}` : base
}

export function runSource(source: Source): RunSource {
  // A shared breakdown is a public GitHub change, so it counts like a link.
  return source.kind === 'shared' ? 'link' : source.kind
}

/** The same request with a different focus, for drilling into one file. */
export function hrefFor(request: Request, only: string | null): string {
  const s = request.source
  const params = new URLSearchParams()
  if (s.kind === 'sample') params.set('sample', s.id)
  else if (s.kind === 'link') params.set('url', s.url)
  else if (s.kind === 'paste') params.set('paste', '1')
  else if (s.kind === 'shared') params.set('shared', s.id)
  else {
    params.set('repo', s.repo)
    if ('pr' in s) params.set('pr', String(s.pr))
    else params.set('sha', s.sha)
  }
  if (only) params.set('only', only)
  return `/b?${params.toString()}`
}
