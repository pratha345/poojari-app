// Local test config: Frontend = localhost:5173, API = production
const { defineConfig, devices } = require('@playwright/test');

process.env.API_BASE_URL  = 'https://pujari.mydashboard.site/api';
process.env.ADMIN_PHONE   = '9307720459';
process.env.ADMIN_PASS    = 'Admin@123';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 45000,
  retries: 1,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-local', open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    actionTimeout: 15000,
    navigationTimeout: 25000,
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } } }],
});
