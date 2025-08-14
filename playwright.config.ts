import type { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm run dev',
    port: 5173,
    reuseExistingServer: true,
  },
}

export default config


