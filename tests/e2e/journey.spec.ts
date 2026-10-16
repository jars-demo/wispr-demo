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
  await expect(page.getByRole('button', { name: 'Tap to talk' })).toBeVisible()
  await expect(page.getByLabel('What do you want your agent to build?')).toBeVisible()
  await expectNoSidewaysScroll(page)
})

test('speaking or typing on the landing page becomes a saved checklist', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('What do you want your agent to build?').fill(REQUEST)
  await page.getByRole('button', { name: 'Make my checklist' }).click()

  await expect(page).toHaveURL(/\/new$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Is this what you')
  await expect(page.getByLabel('R1 text')).toHaveValue('Add rate limiting to the login route.')
  await expect(page.getByLabel('N1 text')).toHaveValue('Do not touch signup.')
  await expect(page.getByLabel('Q1 text')).toHaveValue('Log blocked attempts?')
  await expectNoSidewaysScroll(page)

  await page.getByRole('button', { name: 'Save checklist' }).click()

  await expect(page).toHaveURL(/\/specs\/[0-9a-f-]{36}$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Add rate limiting to the login route',
  )
  await expect(
    page.getByRole('main').getByRole('listitem').filter({ hasText: 'Do not touch signup.' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copy for your agent' })).toBeVisible()
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
