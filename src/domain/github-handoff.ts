// Pure rules for handing a receipt to an agent on GitHub and following it to a pull request.
// The network calls live in src/features/connect/github.ts; this file only shapes data.

export type RepoName = `${string}/${string}`

const REPO = /^[\w.-]+\/[\w.-]+$/
const ISSUE_URL = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/issues\/(\d+)$/

export function isRepoName(value: string): value is RepoName {
  return REPO.test(value)
}

export function parseIssueUrl(url: string | null): { repo: RepoName; number: number } | null {
  const match = url ? ISSUE_URL.exec(url) : null
  if (!match?.[1] || !match[2] || !isRepoName(match[1])) return null
  return { repo: match[1], number: Number(match[2]) }
}

/** Copilot is started by assignment; Claude (the Claude GitHub app) by an @claude mention. */
export function issueFor(agent: 'copilot' | 'claude-github', title: string, brief: string) {
  return agent === 'copilot'
    ? { title, body: brief, assignees: ['copilot-swe-agent[bot]'] }
    : {
        title,
        body: `${brief}\n\n@claude please implement this issue and open a pull request.`,
      }
}

type TimelineEvent = {
  event?: string
  source?: { issue?: { number?: number; pull_request?: unknown } }
}

/** The newest pull request that mentions the issue, from its timeline. */
export function linkedPullNumber(events: readonly unknown[]): number | null {
  let found: number | null = null
  for (const raw of events) {
    const event = raw as TimelineEvent
    const issue = event.source?.issue
    if (event.event === 'cross-referenced' && issue?.pull_request && issue.number) {
      found = issue.number
    }
  }
  return found
}

export type PullState = { draft: boolean; state: string; merged: boolean; title: string }

/** The agent is finished when its pull request is out of draft and not marked work in progress. */
export function pullIsReady(pull: PullState): boolean {
  if (pull.merged) return true
  return pull.state === 'open' && !pull.draft && !/^\s*\[WIP\]/i.test(pull.title)
}
