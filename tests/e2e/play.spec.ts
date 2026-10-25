import { expect, test, type Page } from '@playwright/test'

// The core loop with no keys and no network: the sample wire, a full breakdown game, the XP it
// earns, and the share card. Runs on desktop and phone projects.

async function noSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
}

test('the home page shows the tagline, search and a labelled sample wire', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('SHIPPED IT?')
  await expect(page.getByRole('search')).toBeVisible()
  await expect(page.getByText('Sample wire · connect GitHub for yours')).toBeVisible()
  await expect(page.locator('article').getByRole('button', { name: /Break it down/ })).toHaveCount(
    4,
  )
  await noSidewaysScroll(page)
})

test('a full sample breakdown earns XP and unlocks the first achievement', async ({ page }) => {
  await page.goto('/b?sample=pagination')
  await expect(page.getByText('Sample change · ready-made breakdown')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Cursor pagination for GET /posts',
  )
  await noSidewaysScroll(page)

  await page.getByRole('button', { name: 'Skip to the engineering' }).click()
  for (const name of [
    'Cursor (keyset) pagination',
    'Tie-breaker sort key',
    'The limit + 1 trick',
  ]) {
    await page
      .getByRole('button', { name: new RegExp(name.replace(/[()+]/g, '\\$&')) })
      .first()
      .click()
  }
  await page.getByRole('button', { name: 'Next: predict it →' }).click()

  const answers = [
    'The posts and nextCursor: null',
    'Two posts can share a timestamp, so id gives each row a unique position',
    '101',
  ]
  for (const [i, answer] of answers.entries()) {
    await page.getByRole('group', { name: 'Answers' }).getByRole('button', { name: answer }).click()
    await expect(page.getByText('Called it.')).toBeVisible()
    await page
      .getByRole('button', {
        name: i === answers.length - 1 ? 'Next: explain it back →' : 'Next question →',
      })
      .click()
  }

  await page
    .getByLabel('Your explanation')
    .fill(
      'The client passes back the next cursor, and the query starts after the last row instead of using offset, so new posts never shift pages. It fetches one extra row to know if there is more.',
    )
  await page.getByRole('button', { name: /Lock it in/ }).click()

  await expect(page.getByText('Perfect round')).toBeVisible()
  await expect(page.getByText('First breakdown').first()).toBeVisible()
  // Samples are never shareable: only public GitHub changes the server broke down are.
  await expect(page.getByRole('switch', { name: 'Make this breakdown public' })).toHaveCount(0)

  // The card pops up on its own, ready to post on X with both handles and the real site link.
  const modal = page.getByRole('dialog', { name: 'Your card is ready' })
  await expect(modal).toBeVisible()
  const post = modal.getByRole('link', { name: 'Post on X' })
  await expect(post).toHaveAttribute('href', /x\.com\/intent\/post/)
  const href = decodeURIComponent((await post.getAttribute('href')) ?? '')
  expect(href).toContain('@WisprFlow')
  expect(href).toContain('@jishanarshaikh')
  expect(href).toContain('wispr.jishanahmed.in/card/')
  expect(href).not.toContain('localhost')
  await modal.getByRole('button', { name: 'Close' }).click()
  await expect(modal).toBeHidden()

  await expect(page.getByRole('link', { name: /Your card: level/ })).toContainText('XP')
  await page.getByRole('button', { name: 'Share my card' }).click()
  await expect(modal).toBeVisible()
  await noSidewaysScroll(page)
})

test('the card page offers sharing and shows locked avatars', async ({ page }) => {
  await page.goto('/me')
  await expect(page.getByRole('link', { name: 'Post on X' })).toHaveAttribute(
    'href',
    /x\.com\/intent\/post/,
  )
  await expect(page.getByRole('region', { name: 'Avatars' })).toContainText('2 of 10')
  await noSidewaysScroll(page)
})

test('learn from others lists shared breakdowns or explains how to share', async ({ page }) => {
  await page.goto('/learn')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('broken down by')
  await expect(
    page.getByRole('link', { name: /Play/ }).first().or(page.getByText('Nothing shared yet')),
  ).toBeVisible()
  await noSidewaysScroll(page)

  await page.goto('/b?shared=00000000-0000-4000-8000-000000000000')
  await expect(page.getByText(/That shared breakdown is gone/)).toBeVisible()
})

test('a malformed share link shows not found, a junk link is explained', async ({
  page,
  request,
}) => {
  // The card streams inside Suspense, so the status is already sent; the page says not found.
  await page.goto('/card/not-a-real-card')
  await expect(page.getByText('Nothing here')).toBeVisible()

  const api = await request.post('/api/breakdown', {
    data: { source: { kind: 'link', url: 'https://example.com/nope' } },
  })
  expect([422, 503]).toContain(api.status())
})
