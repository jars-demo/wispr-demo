// GitHub, straight from the browser. The token stays in this browser (localStorage) and is only
// ever sent to api.github.com; Breakdown's own server never sees it.

import { headline, mergeFeed, type FeedItem } from '@/domain/feed'

const API = 'https://api.github.com'

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

function explain(status: number): string {
  if (status === 401) return 'GitHub did not accept this token. Check it or make a new one.'
  if (status === 403) return 'GitHub said no: the token lacks access, or the rate limit was hit.'
  if (status === 404) return 'Not found, or this token cannot see that repository.'
  return `GitHub returned an error (${status}). Try again in a moment.`
}

async function call(token: string, path: string, accept = 'application/vnd.github+json') {
  let response: Response
  try {
    response = await fetch(`${API}${path}`, {
      cache: 'no-store',
      headers: {
        Accept: accept,
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
  } catch {
    throw new GitHubError('Could not reach GitHub. Check your connection.', 0)
  }
  if (!response.ok) throw new GitHubError(explain(response.status), response.status)
  return response
}

const json = async <T>(token: string, path: string): Promise<T> =>
  (await call(token, path)).json() as Promise<T>

export async function getViewer(token: string): Promise<{ login: string }> {
  return json(token, '/user')
}

type Repo = { full_name: string; pushed_at: string | null }
type Commit = {
  sha: string
  html_url: string
  commit: { message: string; author: { date: string } | null }
  author: { login: string } | null
}
type Pull = {
  number: number
  title: string
  html_url: string
  updated_at: string
  user: { login: string } | null
}

const enc = encodeURIComponent

/** Recent pull requests and the player's own commits across the repos they pushed to last. */
export async function loadFeed(token: string, login: string): Promise<FeedItem[]> {
  const repos = await json<Repo[]>(token, '/user/repos?per_page=6&sort=pushed')
  const perRepo = await Promise.all(
    repos.map(async (repo) => {
      const name = repo.full_name
      const [commits, pulls] = await Promise.all([
        json<Commit[]>(token, `/repos/${name}/commits?per_page=5&author=${enc(login)}`).catch(
          () => [] as Commit[],
        ),
        json<Pull[]>(
          token,
          `/repos/${name}/pulls?state=all&sort=updated&direction=desc&per_page=4`,
        ).catch(() => [] as Pull[]),
      ])
      const items: FeedItem[] = [
        ...pulls.map((p): FeedItem => ({
          id: `gh:${name}#${p.number}`,
          kind: 'pr',
          repo: name,
          title: headline(p.title),
          author: p.user?.login ?? 'unknown',
          at: p.updated_at,
          url: p.html_url,
          additions: null,
          deletions: null,
          source: { kind: 'github', repo: name, pr: p.number },
        })),
        ...commits
          // Merge commits repeat what their pull request already shows.
          .filter((c) => !/^Merge (pull request|branch)/.test(c.commit.message))
          .map((c): FeedItem => ({
            id: `gh:${name}@${c.sha}`,
            kind: 'commit',
            repo: name,
            title: headline(c.commit.message),
            author: c.author?.login ?? login,
            at: c.commit.author?.date ?? new Date(0).toISOString(),
            url: c.html_url,
            additions: null,
            deletions: null,
            source: { kind: 'github', repo: name, sha: c.sha },
          })),
      ]
      return items
    }),
  )
  return mergeFeed(perRepo.flat())
}

const DIFF = 'application/vnd.github.diff'

export async function getPullDiff(token: string, repo: string, pull: number): Promise<string> {
  return (await call(token, `/repos/${repo}/pulls/${pull}`, DIFF)).text()
}

export async function getCommitDiff(token: string, repo: string, sha: string): Promise<string> {
  return (await call(token, `/repos/${repo}/commits/${sha}`, DIFF)).text()
}
