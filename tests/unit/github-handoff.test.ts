import { describe, expect, it } from 'vitest'

import {
  issueFor,
  isRepoName,
  linkedPullNumber,
  parseIssueUrl,
  pullIsReady,
} from '@/domain/github-handoff'
import { receiptStatus } from '@/domain/receipt-status'

describe('repos and issue links', () => {
  it('accepts owner/name only', () => {
    expect(isRepoName('jars-demo/wispr-demo')).toBe(true)
    expect(isRepoName('wispr-demo')).toBe(false)
    expect(isRepoName('a/b/c')).toBe(false)
  })

  it('reads an issue link and nothing else', () => {
    expect(parseIssueUrl('https://github.com/jars-demo/wispr-demo/issues/42')).toEqual({
      repo: 'jars-demo/wispr-demo',
      number: 42,
    })
    expect(parseIssueUrl('https://github.com/jars-demo/wispr-demo/pull/42')).toBeNull()
    expect(parseIssueUrl(null)).toBeNull()
  })
})

describe('issueFor', () => {
  it('assigns Copilot, and mentions @claude for Claude', () => {
    expect(issueFor('copilot', 'T', 'brief').assignees).toEqual(['copilot-swe-agent[bot]'])
    const claude = issueFor('claude-github', 'T', 'brief')
    expect(claude.body.startsWith('brief')).toBe(true)
    expect(claude.body).toContain('@claude')
    expect('assignees' in claude).toBe(false)
  })
})

describe('following the agent', () => {
  it('finds the newest pull request that mentions the issue', () => {
    const events = [
      { event: 'labeled' },
      { event: 'cross-referenced', source: { issue: { number: 7 } } },
      { event: 'cross-referenced', source: { issue: { number: 8, pull_request: {} } } },
      { event: 'cross-referenced', source: { issue: { number: 9, pull_request: {} } } },
    ]
    expect(linkedPullNumber(events)).toBe(9)
    expect(linkedPullNumber([])).toBeNull()
  })

  it('waits while the pull request is a draft or marked [WIP]', () => {
    const pull = { draft: false, state: 'open', merged: false, title: 'Add rate limit' }
    expect(pullIsReady(pull)).toBe(true)
    expect(pullIsReady({ ...pull, draft: true })).toBe(false)
    expect(pullIsReady({ ...pull, title: '[WIP] Add rate limit' })).toBe(false)
    expect(pullIsReady({ ...pull, state: 'closed', merged: true })).toBe(true)
    expect(pullIsReady({ ...pull, state: 'closed' })).toBe(false)
  })
})

describe('receiptStatus after a new send', () => {
  it('treats work sent after the last check as not checked yet', () => {
    const check = {
      summary: { found: 1, partly: 0, missing: 0, cantTell: 0, total: 1 },
      claims: [],
      nonGoals: [],
    } as never
    expect(
      receiptStatus({
        sentAt: '2026-10-17T10:00:00Z',
        sentVia: 'codex',
        lastCheck: check,
        lastCheckAt: '2026-10-17T09:00:00Z',
      }),
    ).toMatchObject({ stage: 'sent', label: 'Sent to Codex CLI' })
  })
})

describe('receiptStatus', () => {
  const result = (found: number, total: number) =>
    ({
      summary: { found, partly: 0, missing: total - found, cantTell: 0, total },
      claims: [],
      nonGoals: [],
    }) as never

  it('moves from ready, to sent, to checked', () => {
    expect(receiptStatus({ sentAt: null, sentVia: null, lastCheck: null })).toMatchObject({
      stage: 'ready',
      label: 'Ready to send',
    })
    expect(
      receiptStatus({ sentAt: new Date(), sentVia: 'copilot', lastCheck: null }),
    ).toMatchObject({
      stage: 'sent',
      label: 'Sent to Copilot',
      detail: 'Not checked yet',
    })
    expect(receiptStatus({ sentAt: null, sentVia: null, lastCheck: result(2, 2) })).toMatchObject({
      label: 'Done',
      tone: 'ok',
    })
    expect(receiptStatus({ sentAt: null, sentVia: null, lastCheck: result(1, 3) })).toMatchObject({
      label: '1 of 3 done',
      tone: 'warn',
    })
  })
})
