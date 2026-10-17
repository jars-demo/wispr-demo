import { expect, test, type Route } from '@playwright/test'

import { SAMPLE_DIFF, SAMPLE_SUMMARY } from '../../src/domain/check/sample'

// The GitHub handoff end to end, with GitHub's API answered by this test instead of the network:
// connect a token, pick a repo, send to Copilot, follow the issue to its pull request, and let
// Receipts check the work by itself. The browser talks to api.github.com directly, exactly as it
// does for real; only the answers are canned.

const REPO = 'ada/shop'
const ISSUE = 7
const PULL = 8

type Seen = { method: string; path: string; auth: string | null; body: unknown }

function cors(route: Route, status: number, body: string, contentType = 'application/json') {
  return route.fulfill({
    status,
    body,
    contentType,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, content-type, x-github-api-version',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
    },
  })
}

test('send to Copilot on GitHub, then the pull request is checked by itself', async ({ page }) => {
  const seen: Seen[] = []
  // Every request that leaves the page, to prove the token goes nowhere but GitHub.
  const leaks: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.hostname === 'api.github.com') return
    const sent = JSON.stringify(request.headers()) + (request.postData() ?? '') + request.url()
    if (sent.includes('github_pat_test')) leaks.push(request.url())
  })
  await page.route('https://api.github.com/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (request.method() === 'OPTIONS') return cors(route, 204, '')
    seen.push({
      method: request.method(),
      path: url.pathname,
      auth: request.headers()['authorization'] ?? null,
      body: request.postData() ? JSON.parse(request.postData() ?? '{}') : null,
    })
    const json = (value: unknown) => cors(route, 200, JSON.stringify(value))
    switch (`${request.method()} ${url.pathname}`) {
      case 'GET /user':
        return json({ login: 'ada' })
      case 'GET /user/repos':
        return json([{ full_name: REPO, private: true }])
      case `POST /repos/${REPO}/issues`:
        return cors(
          route,
          201,
          JSON.stringify({
            number: ISSUE,
            html_url: `https://github.com/${REPO}/issues/${ISSUE}`,
            assignees: [{ login: 'Copilot' }],
          }),
        )
      case `GET /repos/${REPO}/issues/${ISSUE}/timeline`:
        return json([
          { event: 'cross-referenced', source: { issue: { number: PULL, pull_request: {} } } },
        ])
      case `GET /repos/${REPO}/pulls/${PULL}`:
        return request.headers()['accept'] === 'application/vnd.github.diff'
          ? cors(route, 200, SAMPLE_DIFF, 'text/plain')
          : json({
              number: PULL,
              html_url: `https://github.com/${REPO}/pull/${PULL}`,
              draft: false,
              state: 'open',
              merged: false,
              title: 'Rate-limit login',
              body: SAMPLE_SUMMARY,
            })
      default:
        return cors(route, 404, JSON.stringify({ message: 'Not Found' }))
    }
  })

  // Step 1: say it (the sample request), print the receipt.
  await page.goto('/new')
  await page.getByRole('button', { name: 'Fill in an example' }).click()
  await page.getByRole('button', { name: 'Turn into a receipt' }).click()
  await page.getByRole('button', { name: 'Print my receipt' }).click()
  await expect(page).toHaveURL(/\/specs\/[0-9a-f-]{36}$/)
  await expect(page.getByLabel(/^Status: Ready to send/)).toBeVisible()
  const receiptUrl = page.url()

  // Connect GitHub and pick a repo.
  await page.getByRole('button', { name: 'Connect GitHub' }).click()
  await page.getByLabel('GitHub token').fill('github_pat_test')
  await page.getByRole('button', { name: 'Connect', exact: true }).click()
  await page.getByLabel('Which repo should the agent work in?').selectOption(REPO)
  await expect(page.getByText(`${REPO}`, { exact: true })).toBeVisible()

  // One tap on Copilot: an issue assigned to Copilot, with the full brief.
  await page.getByRole('button', { name: /^Copilot/ }).click()

  // Receipts follows the pull request and checks it with no pasting.
  await expect(page).toHaveURL(/\/checks\/[0-9a-f-]{36}$/, { timeout: 30_000 })
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/\d of 2/)

  const issue = seen.find((call) => call.method === 'POST')
  expect(issue?.path).toBe(`/repos/${REPO}/issues`)
  expect(issue?.body).toMatchObject({ assignees: ['copilot-swe-agent[bot]'] })
  expect(JSON.stringify(issue?.body)).toContain('## Requirements')
  expect(seen.every((call) => call.auth === 'Bearer github_pat_test')).toBe(true)
  expect(leaks, 'token sent somewhere other than api.github.com').toEqual([])

  // The receipt now says where it went.
  await page.goto(receiptUrl)
  await expect(page.getByLabel(/^Status: (Done|\d of 2 done)/)).toBeVisible()
})
