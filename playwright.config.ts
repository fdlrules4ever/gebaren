import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Runs against `wrangler dev` (needs `pnpm build` first), or against BASE_URL (e.g. the live site).
// Uses the locally installed Chrome, so no browser download is needed.
const local = 'http://127.0.0.1:8788';
const baseURL = process.env.BASE_URL ?? local;
// Fresh local state per run: no rate-limit counters or cached API answers from earlier runs.
const state = join(tmpdir(), `gebaren-e2e-${Date.now()}`);

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL, channel: 'chrome', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 860 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chrome' } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `pnpm exec wrangler dev --port 8788 --ip 127.0.0.1 --var LERENGEBAREN_FALLBACK:off --persist-to "${state}"`,
        url: `${local}/api/health`,
        reuseExistingServer: false,
        timeout: 90_000,
      },
});
