import { defineConfig, devices } from '@playwright/test'

// End-to-end tests against a running app. Locally they reuse `npm run dev` on port 3000;
// set E2E_BASE_URL to point them at a deployment instead.

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // iPhone-sized viewport, touch and pixel density, rendered with Chromium.
    {
      name: 'phone',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
    { name: 'small-phone', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 740 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run dev', url: baseURL, reuseExistingServer: true, timeout: 120_000 },
})
