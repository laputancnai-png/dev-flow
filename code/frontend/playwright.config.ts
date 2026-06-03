import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:6171',
    headless: true,
  },
  webServer: {
    command: 'npm run dev -- --port 6171',
    url: 'http://localhost:6171',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
