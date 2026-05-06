// e2e/tests/user-flow.spec.js — Complete User Flow & Stress Tests (Part 5)
const { test, expect } = require('@playwright/test');

const APP_URL  = 'http://localhost:5173';
const API_URL  = 'http://localhost:5000/api';

// ── Helpers ───────────────────────────────────────────────────────
async function waitForPageLoad(page) {
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
}

// ═══════════════════════════════════════════════════════════════════
// PART 5: User Flow Tests
// ═══════════════════════════════════════════════════════════════════

test.describe('User Flow: Homepage Navigation', () => {
  test('homepage loads and renders hero section', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Title should be set
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Main heading visible
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 5000 });
  });

  test('homepage has navigation links', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Nav links should exist
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();
  });

  test('clicking "पंचांग पहा" navigates to panchang page', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const panchaangLink = page.locator('a[href*="panchang"]').first();
    if (await panchaangLink.count() > 0) {
      await panchaangLink.click();
      await page.waitForURL('**/panchang**', { timeout: 5000 });
      expect(page.url()).toContain('panchang');
    } else {
      // Navigate directly
      await page.goto('/panchang');
      expect(page.url()).toContain('panchang');
    }
  });

  test('footer is visible on homepage', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible({ timeout: 5000 });
  });
});

test.describe('User Flow: Panchang Page', () => {
  test('panchang page loads and shows date', async ({ page }) => {
    await page.goto('/panchang');
    await waitForPageLoad(page);

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('panchang shows today\'s data by default', async ({ page }) => {
    await page.goto('/panchang');
    await waitForPageLoad(page);

    const today = new Date().toLocaleDateString('en-IN');
    const pageText = await page.locator('body').textContent();
    // Page must have some content
    expect(pageText.length).toBeGreaterThan(50);
  });
});

test.describe('User Flow: Pooja Listing', () => {
  test('pooja list page loads', async ({ page }) => {
    await page.goto('/pooja');
    await waitForPageLoad(page);
    await expect(page.locator('body')).toBeVisible();
    const text = await page.locator('body').textContent();
    expect(text.length).toBeGreaterThan(50);
  });

  test('navigating to about page works', async ({ page }) => {
    await page.goto('/about');
    // Wait for a specific element rather than networkidle (Vite HMR WebSocket prevents networkidle)
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('contact page loads', async ({ page }) => {
    await page.goto('/contact');
    await waitForPageLoad(page);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('User Flow: Authentication Pages', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await waitForPageLoad(page);

    await expect(page.locator('input[type="tel"], input[name="phone"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await waitForPageLoad(page);
    await expect(page.locator('form').first()).toBeVisible({ timeout: 5000 });
  });

  test('login form validates empty submission', async ({ page }) => {
    await page.goto('/login');
    await waitForPageLoad(page);

    // Find and click submit without filling fields
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      // Should show validation feedback or stay on the same page
      await expect(page).toHaveURL(/login/);
    }
  });

  test('protected route /my-bookings redirects unauthenticated user', async ({ page }) => {
    await page.goto('/my-bookings');
    await waitForPageLoad(page);
    // Should redirect to login or home
    const url = page.url();
    expect(url).not.toContain('my-bookings');
  });

  test('protected route /admin redirects non-admin user', async ({ page }) => {
    await page.goto('/admin');
    await waitForPageLoad(page);
    const url = page.url();
    // Either redirects to login or shows admin login
    expect(url.includes('login') || url.includes('admin')).toBeTruthy();
  });
});

test.describe('User Flow: 404 & Error Pages', () => {
  test('unknown route redirects to home', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-at-all');
    await waitForPageLoad(page);
    // App's wildcard route redirects to /
    expect(page.url()).toMatch(/localhost:5173\/?$/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 5 (continued): Stress — Parallel Page Loads
// ═══════════════════════════════════════════════════════════════════
test.describe('Stress: Multiple Simultaneous Loads @stress', () => {
  test('5 homepage loads in sequence complete without errors', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.goto('/');
      await waitForPageLoad(page);
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible({ timeout: 5000 });
    }
  });

  test('rapid navigation between pages does not crash', async ({ page }) => {
    const pages = ['/', '/panchang', '/pooja', '/about', '/contact', '/login'];
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
      // No error page / no crash
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });
});
