const { defineConfig, devices } = require('@playwright/test');

process.env.API_BASE_URL = process.env.PROD_API ? 'https://pujari.mydashboard.site/api' : 'https://pujari.mydashboard.site/api';
process.env.ADMIN_PHONE  = '9307720459';
process.env.ADMIN_PASS   = 'Admin@123';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 45000,
  retries: 1,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-prod', open: 'never' }]],
  use: {
    baseURL: 'https://pujari.mydashboard.site',
    actionTimeout: 15000,
    navigationTimeout: 25000,
    screenshot: 'only-on-failure',
    extraHTTPHeaders: { 'x-test-env': 'production' },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } } }],
});
