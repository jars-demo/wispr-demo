import 'server-only'

// Fetches the unified diff behind a public GitHub pull request, compare or commit link.
// The host is fixed to github.com and the path is validated, so user input can never point the
// server at another address. Size and time are capped.

const LINK =
  /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/(pull\/\d+|compare\/[\w.\-/~^]+|commit\/[0-9a-f]{7,40})\/?$/i

export const MAX_DIFF_BYTES = 400_000

export type GitHubLink = {
  owner: string
  repo: string
  path: string
  kind: 'pull' | 'compare' | 'commit'
}

export function parseGitHubLink(url: string): GitHubLink | null {
  const match = LINK.exec(url.trim().replace(/[?#].*$/, ''))
  if (!match?.[1] || !match[2] || !match[3]) return null
  const path = match[3].replace(/\/$/, '')
  const kind = path.startsWith('pull/')
    ? 'pull'
    : path.startsWith('compare/')
      ? 'compare'
      : 'commit'
  return { owner: match[1], repo: match[2], path, kind }
}

export class GitHubFetchError extends Error {
  override name = 'GitHubFetchError'
  constructor(readonly userMessage: string) {
    super(userMessage)
  }
}

export async function fetchGitHubDiff(link: GitHubLink): Promise<string> {
  const url = `https://github.com/${link.owner}/${link.repo}/${link.path}.diff`
  let response: Response
  try {
    response = await fetch(url, {
      headers: { Accept: 'text/plain', 'User-Agent': 'receipts-check' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    })
  } catch {
    throw new GitHubFetchError('GitHub did not answer in time. Try again, or paste the diff.')
  }
  if (response.status === 404) {
    throw new GitHubFetchError(
      'That link was not found. Private repositories are not supported yet.',
    )
  }
  if (!response.ok)
    throw new GitHubFetchError('GitHub refused the request. Paste the diff instead.')
  const text = await response.text()
  if (text.length > MAX_DIFF_BYTES) {
    throw new GitHubFetchError('That change is too large to check here. Paste a smaller diff.')
  }
  return text
}
