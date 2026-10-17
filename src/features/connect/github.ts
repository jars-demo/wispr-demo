// GitHub, straight from the browser. The token stays in this browser (localStorage) and is only
// ever sent to api.github.com; Receipts' own server never sees it.

import type { PullState, RepoName } from '@/domain/github-handoff'

const API = 'https://api.github.com'

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

function explain(status: number, apiMessage: string): string {
  if (status === 401) return 'GitHub did not accept this token. Check it or make a new one.'
  if (status === 403)
    return 'This token is not allowed to do that. Check its repository permissions.'
  if (status === 404) return 'Repository not found, or this token cannot see it.'
  if (status === 422) return `GitHub refused the request: ${apiMessage || 'invalid input'}.`
  return `GitHub returned an error (${status}). Try again in a moment.`
}

async function call(token: string, path: string, init: RequestInit = {}, accept?: string) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: accept ?? 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
  if (!response.ok) {
    let message = ''
    try {
      message = String(((await response.json()) as { message?: unknown }).message ?? '')
    } catch {
      // Not JSON: keep the status-based message.
    }
    throw new GitHubError(explain(response.status, message), response.status)
  }
  return response
}

const json = async <T>(token: string, path: string, init?: RequestInit): Promise<T> =>
  (await call(token, path, init)).json() as Promise<T>

export async function getViewer(token: string): Promise<{ login: string }> {
  return json(token, '/user')
}

export type Repo = { full_name: string; private: boolean }

export async function listRepos(token: string): Promise<Repo[]> {
  return json(token, '/user/repos?per_page=100&sort=pushed')
}

export async function createIssue(
  token: string,
  repo: RepoName,
  issue: { title: string; body: string; assignees?: string[] },
): Promise<{ number: number; html_url: string; assignees?: { login: string }[] }> {
  return json(token, `/repos/${repo}/issues`, { method: 'POST', body: JSON.stringify(issue) })
}

export async function getTimeline(
  token: string,
  repo: RepoName,
  issue: number,
): Promise<unknown[]> {
  return json(token, `/repos/${repo}/issues/${issue}/timeline?per_page=100`)
}

export type Pull = PullState & { number: number; html_url: string; body: string | null }

export async function getPull(token: string, repo: RepoName, pull: number): Promise<Pull> {
  return json(token, `/repos/${repo}/pulls/${pull}`)
}

export async function getPullDiff(token: string, repo: RepoName, pull: number): Promise<string> {
  return (
    await call(token, `/repos/${repo}/pulls/${pull}`, {}, 'application/vnd.github.diff')
  ).text()
}
