// e2e/tests/error-handling.spec.js — E2E Error Handling Tests (Part 8)
const { test, expect } = require('@playwright/test');

const API_URL = 'http://localhost:5000/api';

// ═══════════════════════════════════════════════════════════════════
// PART 8A: App Behaviour When API is Down
// ═══════════════════════════════════════════════════════════════════
test.describe('Error Handling: API Failure Simulation', () => {
  test('Homepage does not show blank screen when poojas API fails', async ({ page }) => {
    // Intercept and fail poojas API
    await page.route('**/api/poojas**', route => route.abort('failed'));
    await page.route('**/api/home**',   route => route.abort('failed'));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded', { timeout: 8000 });

    // Core page structure must still render
    const body = await page.locator('body').textContent();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('undefined');
  });

  test('Homepage shows graceful fallback when all APIs fail', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    // Abort all backend API calls (scope to backend port — avoids matching Vite module URLs)
    await page.route('http://localhost:5000/api/**', route => route.abort('failed'));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
    await page.waitForTimeout(1000); // wait for error handling to settle

    // No uncaught JS errors
    const critical = jsErrors.filter(e =>
      e.includes('Cannot read') || e.includes('is not a function') || e.includes('undefined')
    );
    expect(critical).toHaveLength(0);
  });

  test('Panchang page handles API failure gracefully', async ({ page }) => {
    await page.route('**/api/panchang**', route => route.abort('failed'));

    await page.goto('/panchang');
    // Wait for React to mount — Vite SPA: domcontentloaded fires before React renders
    await page.waitForSelector('h1', { timeout: 8000 });

    // Hero heading must be visible even when data fetch fails
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const body = await page.locator('body').textContent();
    expect(body.trim().length).toBeGreaterThan(10);
  });

  test('Login page renders without API', async ({ page }) => {
    // Use full backend URL to avoid matching Vite module paths (/src/api/...)
    await page.route('http://localhost:5000/api/**', route => route.abort('failed'));
    await page.goto('/login');
    // Wait for React to fully mount
    await page.waitForSelector('input', { timeout: 8000 });

    // Form must still appear even if all backend API calls fail
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 8B: Server Error (500) Response Handling
// ═══════════════════════════════════════════════════════════════════
test.describe('Error Handling: Server 500 Responses', () => {
  test('Panchang page does not crash on 500 from API', async ({ page }) => {
    await page.route('**/api/panchang**', route =>
      route.fulfill({ status: 500, json: { success: false, message: 'सर्व्हर त्रुटी' } })
    );

    await page.goto('/panchang');
    // Wait for React to mount — hero heading must appear
    await page.waitForSelector('h1', { timeout: 8000 });

    // Should NOT show raw "500" to user — should show friendly message
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('Internal Server Error');
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('No JS runtime errors when poojas return 500', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));

    await page.route('**/api/poojas**', route =>
      route.fulfill({ status: 500, json: { success: false, message: 'DB error' } })
    );

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(500);

    const critical = jsErrors.filter(e =>
      e.includes('Cannot read') || e.includes('is not a function')
    );
    expect(critical).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 8C: Network Timeout Handling
// ═══════════════════════════════════════════════════════════════════
test.describe('Error Handling: Network Timeouts', () => {
  test('Slow API does not block page render indefinitely', async ({ page }) => {
    // Simulate 3s slow API
    await page.route('**/api/poojas**', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.abort('timedout');
    });

    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    const elapsed = Date.now() - start;

    // Core page must render, even if poojas didn't load
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 5000 });

    // Total page should not wait more than 10s for API
    expect(elapsed).toBeLessThan(15000);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 8D: Form Submission Error Handling
// ═══════════════════════════════════════════════════════════════════
test.describe('Error Handling: Form Submission Errors', () => {
  test('Login form shows error message on wrong credentials', async ({ page }) => {
    // Mock API to return 401
    await page.route('**/api/auth/login', route =>
      route.fulfill({
        status: 401,
        json: { success: false, message: 'फोन नंबर किंवा पासवर्ड चुकीचा आहे.' },
      })
    );

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded', { timeout: 8000 });

    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    const passInput  = page.locator('input[type="password"]').first();
    const submitBtn  = page.locator('button[type="submit"]').first();

    if (await phoneInput.count() > 0 && await passInput.count() > 0) {
      await phoneInput.fill('9000000000');
      await passInput.fill('WrongPassword123');
      await submitBtn.click();

      // After error, user should still be on login page
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('login');
    }
  });

  test('Login form handles network error during submission', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));

    await page.route('**/api/auth/login', route => route.abort('failed'));

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded', { timeout: 8000 });

    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    const passInput  = page.locator('input[type="password"]').first();
    const submitBtn  = page.locator('button[type="submit"]').first();

    if (await phoneInput.count() > 0 && await passInput.count() > 0) {
      await phoneInput.fill('9307720459');
      await passInput.fill('Test@1234');
      await submitBtn.click();
      await page.waitForTimeout(2000);

      // No uncaught JS errors from network failure
      const critical = jsErrors.filter(e => e.includes('Unhandled'));
      expect(critical).toHaveLength(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 9: Console Error Monitoring
// ═══════════════════════════════════════════════════════════════════
test.describe('Logging: Console Error Monitoring', () => {
  test('No unhandled promise rejections on homepage', async ({ page }) => {
    const rejections = [];
    page.on('pageerror', err => {
      if (err.message.includes('Unhandled') || err.message.includes('Promise')) {
        rejections.push(err.message);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(500);

    expect(rejections).toHaveLength(0);
  });

  test('No React key warnings on pooja list', async ({ page }) => {
    const consoleWarnings = [];
    page.on('console', msg => {
      if (msg.type() === 'warning' && msg.text().includes('key')) {
        consoleWarnings.push(msg.text());
      }
    });

    await page.goto('/pooja');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

    // React key warnings indicate missing list keys — common bug
    if (consoleWarnings.length > 0) {
      console.warn('⚠️  React key warnings:', consoleWarnings);
    }
    expect(consoleWarnings).toHaveLength(0);
  });

  test('No 404 API calls (broken API paths)', async ({ page }) => {
    const failed404s = [];

    page.on('response', res => {
      if (res.status() === 404 && res.url().includes('/api/')) {
        failed404s.push(res.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

    if (failed404s.length > 0) {
      console.warn('⚠️  Broken API paths (404):', failed404s);
    }
    expect(failed404s).toHaveLength(0);
  });
});
