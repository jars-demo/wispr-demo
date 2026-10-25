// The Wire: recent changes shown as a news feed. Items come from GitHub (in the browser, with the
// player's own token) or from the labelled samples. The item id doubles as the run key.

export type FeedSource =
  | { kind: 'sample'; id: string }
  | { kind: 'github'; repo: string; pr: number }
  | { kind: 'github'; repo: string; sha: string }

export type FeedItem = {
  id: string
  kind: 'pr' | 'commit'
  repo: string
  title: string
  author: string
  at: string
  url: string | null
  additions: number | null
  deletions: number | null
  source: FeedSource
}

export const REPO_NAME = /^[\w.-]+\/[\w.-]+$/

export function isRepoName(value: string): boolean {
  return REPO_NAME.test(value)
}

/** Newest first, no duplicates, at most `limit`. */
export function mergeFeed(items: readonly FeedItem[], limit = 24): FeedItem[] {
  const seen = new Set<string>()
  return [...items]
    .sort((a, b) => b.at.localeCompare(a.at))
    .filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)))
    .slice(0, limit)
}

export function timeAgo(iso: string, now: Date): string {
  const minutes = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

/** First line of a commit message, trimmed for a headline. */
export function headline(message: string): string {
  const first = message.split('\n')[0]?.trim() ?? ''
  return first.length > 110 ? `${first.slice(0, 109)}…` : first || 'Untitled change'
}

/** Parses the links people paste into the search bar. Only github.com PR, commit and compare. */
const LINK =
  /^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)\/(pull\/(\d+)|commit\/([0-9a-f]{7,40})|compare\/[\w.\-/~^]+)(?:\/(?:files|commits)?)?\/?$/i

export type ParsedLink = { url: string; repo: string; pr: number | null; sha: string | null }

export function parseChangeLink(input: string): ParsedLink | null {
  const clean = input.trim().replace(/[?#].*$/, '')
  const match = LINK.exec(clean)
  if (!match?.[1] || !match[2] || !match[3]) return null
  const repo = `${match[1]}/${match[2]}`
  const pr = match[4] ? Number(match[4]) : null
  const sha = match[5] ?? null
  return { url: `https://github.com/${repo}/${match[3]}`, repo, pr, sha }
}
