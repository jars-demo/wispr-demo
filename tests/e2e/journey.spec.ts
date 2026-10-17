import { expect, test, type Page } from '@playwright/test'

// The core journey on every screen size: say it on the landing page, review, save, view.
// Speech recognition is not available in headless browsers, so the words are typed, exactly as
// Wispr Flow would type them.

const REQUEST =
  'Add rate limiting to the login route. Do not touch signup. Add tests. Maybe log blocked attempts?'

async function expectNoSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow, 'page scrolls sideways').toBeLessThanOrEqual(0)
}

test('landing page shows one clear action and fits the screen', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Say what you want')
  await expect(page.getByRole('button', { name: 'Make my checklist' })).toBeVisible()
  await expect(page.getByText('Talk with Wispr Flow')).toBeVisible()
  await expect(page.getByLabel('What do you want your agent to build?')).toBeVisible()
  await expectNoSidewaysScroll(page)
})

test('talking (via Wispr Flow) or typing on the landing page becomes a saved checklist', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByLabel('What do you want your agent to build?').fill(REQUEST)
  await page.getByRole('button', { name: 'Make my checklist' }).click()

  await expect(page).toHaveURL(/\/new$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Is this what you')
  await expect(page.getByLabel('R1 text')).toHaveValue(/rate limit/i)
  await expect(page.getByLabel('N1 text')).toHaveValue(/signup/i)
  await expect(page.getByLabel('Q1 text')).toHaveValue(/log blocked attempts\?$/i)
  await expectNoSidewaysScroll(page)

  await page.getByRole('button', { name: 'Looks good, next' }).click()

  await expect(page).toHaveURL(/\/specs\/[0-9a-f-]{36}$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/rate limit/i)
  await expect(page.getByText(/Organised by/)).toHaveCount(0)
  await page.getByText(/Show the checklist/).click()
  await expect(
    page
      .getByRole('main')
      .getByRole('listitem')
      .filter({ hasText: /signup/i })
      .first(),
  ).toBeVisible()
  await page.getByRole('combobox', { name: 'Your agent', exact: true }).selectOption('codex')
  await expect(page.getByRole('button', { name: 'Send to Codex CLI' })).toBeVisible()
  await page.getByText('Preview the brief').click()
  await expect(page.getByText('### Not done or unsure')).toBeVisible()

  // Sending starts a short buffer, then the check opens on the same page.
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download .md' }).click()
  expect((await download).suggestedFilename()).toMatch(/\.md$/)
  await expect(page.getByRole('status').filter({ hasText: 'Your agent is on it' })).toBeVisible()
  await page.getByRole('button', { name: 'Done already? Check now' }).click()
  await expect(page.getByRole('button', { name: 'Check the work' })).toBeVisible()
  await expectNoSidewaysScroll(page)
})

test('nothing to act on gives a clear message instead of an empty checklist', async ({ page }) => {
  await page.goto('/new')
  await page.getByLabel('What do you want your agent to do?').fill('Okay. Thanks.')
  await page.getByRole('button', { name: 'Turn into a checklist' }).click()

  await expect(
    page.getByRole('main').getByRole('alert').filter({ hasText: 'Nothing to act on was found' }),
  ).toBeVisible()
})

test('the sample journey ends with a check that catches the missing tests', async ({ page }) => {
  await page.goto('/new')
  await page.getByRole('button', { name: 'Fill in an example' }).click()
  await page.getByRole('button', { name: 'Turn into a checklist' }).click()
  await page.getByRole('button', { name: 'Looks good, next' }).click()
  await expect(page).toHaveURL(/\/specs\/[0-9a-f-]{36}$/)

  await page.getByRole('button', { name: 'Already sent? Check now' }).click()
  await page.getByRole('button', { name: 'Fill in a sample agent result' }).click()
  await page.getByRole('button', { name: 'Check the work' }).click()

  await expect(page).toHaveURL(/\/checks\/[0-9a-f-]{36}$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/\d of 2/)
  const main = page.getByRole('main')
  await expect(main.getByText('None of the changed files are tests.').first()).toBeVisible()
  await expect(
    main.getByRole('listitem').filter({ hasText: 'Added tests for the limiter.' }),
  ).toContainText('Not true')
  await expect(page.getByRole('button', { name: 'Copy a fix-up prompt' })).toBeVisible()
  await expectNoSidewaysScroll(page)
})
