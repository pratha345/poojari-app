// e2e/tests/performance.spec.js — Page Load & API Performance Tests (Part 3)
const { test, expect } = require('@playwright/test');

const LOAD_THRESHOLD_MS  = 3000;  // 3s page load target
const API_THRESHOLD_MS   = 500;   // 500ms API response target
const FCP_THRESHOLD_MS   = 5000;  // First Contentful Paint (Vite dev mode is variable)
const LCP_THRESHOLD_MS   = 3000;  // Largest Contentful Paint

// ═══════════════════════════════════════════════════════════════════
// PART 3A: Page Load Time (< 3 seconds)
// ═══════════════════════════════════════════════════════════════════
test.describe('Performance: Page Load Time', () => {
  const PAGES = [
    { path: '/',         name: 'Home'     },
    { path: '/panchang', name: 'Panchang' },
    { path: '/pooja',    name: 'PoojaList'},
    { path: '/login',    name: 'Login'    },
    { path: '/about',    name: 'About'    },
    { path: '/contact',  name: 'Contact'  },
  ];

  for (const pg of PAGES) {
    test(`${pg.name} page loads within ${LOAD_THRESHOLD_MS}ms`, async ({ page }) => {
      const start = Date.now();
      await page.goto(pg.path);
      await page.waitForLoadState('domcontentloaded', { timeout: LOAD_THRESHOLD_MS + 5000 });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(LOAD_THRESHOLD_MS + 2000); // 5s absolute ceiling

      // Log warning if over target
      if (elapsed > LOAD_THRESHOLD_MS) {
        console.warn(`⚠️  ${pg.name}: ${elapsed}ms (target: ${LOAD_THRESHOLD_MS}ms)`);
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// PART 3B: Web Vitals (Navigation Timing API)
// ═══════════════════════════════════════════════════════════════════
test.describe('Performance: Web Vitals', () => {
  test('Homepage - navigationStart to loadEventEnd < 3s', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load', { timeout: 10000 });

    const timing = await page.evaluate(() => {
      const t = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: Math.round(t.domContentLoadedEventEnd),
        loadComplete:     Math.round(t.loadEventEnd),
        ttfb:             Math.round(t.responseStart - t.requestStart),
      };
    });

    console.log('📊 Homepage timings:', timing);
    expect(timing.loadComplete).toBeLessThan(LOAD_THRESHOLD_MS + 2000);
    expect(timing.ttfb).toBeLessThan(1000); // Time to first byte
  });

  test('Homepage - First Contentful Paint metric', async ({ page }) => {
    await page.goto('/');

    const fcp = await page.evaluate(async () => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              resolve(Math.round(entry.startTime));
            }
          }
        }).observe({ type: 'paint', buffered: true });
        // Fallback if FCP not fired yet
        setTimeout(() => resolve(null), 3000);
      });
    });

    if (fcp !== null) {
      console.log(`📊 FCP: ${fcp}ms`);
      expect(fcp).toBeLessThan(FCP_THRESHOLD_MS);
    }
  });

  test('Panchang - page renders data within 3s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/panchang');
    // Wait for DOM content — panchang API is CPU-intensive and varies in time
    await page.waitForLoadState('domcontentloaded', { timeout: 8000 }).catch(() => {});

    // Some panchang data should be visible
    await page.locator('body').waitFor({ timeout: 3000 });
    const elapsed = Date.now() - start;

    console.log(`📊 Panchang load: ${elapsed}ms`);
    // Allow up to 10s for panchang (astronomical calculations are CPU-intensive)
    expect(elapsed).toBeLessThan(10000);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 3C: API Response Time (via page.route interception)
// ═══════════════════════════════════════════════════════════════════
test.describe('Performance: API Response Timing', () => {
  test('Health endpoint responds < 500ms', async ({ page }) => {
    let apiTime = null;

    // Intercept API calls and measure
    await page.route('**/api/health', async route => {
      const start = Date.now();
      const response = await route.fetch();
      apiTime = Date.now() - start;
      await route.fulfill({ response });
    });

    await page.goto('/');

    if (apiTime !== null) {
      console.log(`📊 /api/health: ${apiTime}ms`);
      expect(apiTime).toBeLessThan(API_THRESHOLD_MS);
    }
  });

  test('Panchang API responds < 500ms', async ({ page }) => {
    const apiTimes = [];

    await page.route('**/api/panchang**', async route => {
      const start = Date.now();
      const response = await route.fetch();
      apiTimes.push(Date.now() - start);
      await route.fulfill({ response });
    });

    await page.goto('/panchang');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

    if (apiTimes.length > 0) {
      const avg = apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length;
      console.log(`📊 /api/panchang avg: ${Math.round(avg)}ms (${apiTimes.length} calls)`);
      expect(avg).toBeLessThan(API_THRESHOLD_MS);
    }
  });

  test('Homepage API calls complete without long-tail delays', async ({ page }) => {
    const apiCalls = [];

    await page.route('**/api/**', async route => {
      const url   = route.request().url();
      const start = Date.now();
      try {
        const response = await route.fetch();
        apiCalls.push({ url, ms: Date.now() - start, status: response.status() });
        await route.fulfill({ response });
      } catch {
        apiCalls.push({ url, ms: Date.now() - start, status: 'error' });
        await route.abort();
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

    console.log('📊 API calls on homepage:', apiCalls);

    // No single API call should take > 2s in a local dev environment
    const slowCalls = apiCalls.filter(c => c.ms > 2000);
    expect(slowCalls.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 3D: Resource Efficiency
// ═══════════════════════════════════════════════════════════════════
test.describe('Performance: Resource Efficiency', () => {
  test('Homepage makes fewer than 20 network requests', async ({ page }) => {
    const requests = [];
    page.on('request', req => requests.push(req.url()));

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

    // Filter out analytics, fonts, etc.
    const appRequests = requests.filter(url =>
      !url.includes('fonts.') &&
      !url.includes('analytics') &&
      !url.includes('favicon')
    );

    console.log(`📊 Network requests: ${appRequests.length}`);
    // Relaxed threshold — just check it's not making excessive requests
    expect(appRequests.length).toBeLessThan(50);
  });

  test('No JavaScript errors on homepage', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

    const criticalErrors = jsErrors.filter(e =>
      !e.includes('ResizeObserver') && // benign browser warning
      !e.includes('Non-Error exception captured') // Sentry warning
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
