# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance.spec.js >> Performance: Page Load Time >> Login page loads within 3000ms
- Location: tests\performance.spec.js:23:5

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 5000
Received:   9238
```

# Test source

```ts
  1   | // e2e/tests/performance.spec.js — Page Load & API Performance Tests (Part 3)
  2   | const { test, expect } = require('@playwright/test');
  3   | 
  4   | const LOAD_THRESHOLD_MS  = 3000;  // 3s page load target
  5   | const API_THRESHOLD_MS   = 500;   // 500ms API response target
  6   | const FCP_THRESHOLD_MS   = 5000;  // First Contentful Paint (Vite dev mode is variable)
  7   | const LCP_THRESHOLD_MS   = 3000;  // Largest Contentful Paint
  8   | 
  9   | // ═══════════════════════════════════════════════════════════════════
  10  | // PART 3A: Page Load Time (< 3 seconds)
  11  | // ═══════════════════════════════════════════════════════════════════
  12  | test.describe('Performance: Page Load Time', () => {
  13  |   const PAGES = [
  14  |     { path: '/',         name: 'Home'     },
  15  |     { path: '/panchang', name: 'Panchang' },
  16  |     { path: '/pooja',    name: 'PoojaList'},
  17  |     { path: '/login',    name: 'Login'    },
  18  |     { path: '/about',    name: 'About'    },
  19  |     { path: '/contact',  name: 'Contact'  },
  20  |   ];
  21  | 
  22  |   for (const pg of PAGES) {
  23  |     test(`${pg.name} page loads within ${LOAD_THRESHOLD_MS}ms`, async ({ page }) => {
  24  |       const start = Date.now();
  25  |       await page.goto(pg.path);
  26  |       await page.waitForLoadState('domcontentloaded', { timeout: LOAD_THRESHOLD_MS + 5000 });
  27  |       const elapsed = Date.now() - start;
  28  | 
> 29  |       expect(elapsed).toBeLessThan(LOAD_THRESHOLD_MS + 2000); // 5s absolute ceiling
      |                       ^ Error: expect(received).toBeLessThan(expected)
  30  | 
  31  |       // Log warning if over target
  32  |       if (elapsed > LOAD_THRESHOLD_MS) {
  33  |         console.warn(`⚠️  ${pg.name}: ${elapsed}ms (target: ${LOAD_THRESHOLD_MS}ms)`);
  34  |       }
  35  |     });
  36  |   }
  37  | });
  38  | 
  39  | // ═══════════════════════════════════════════════════════════════════
  40  | // PART 3B: Web Vitals (Navigation Timing API)
  41  | // ═══════════════════════════════════════════════════════════════════
  42  | test.describe('Performance: Web Vitals', () => {
  43  |   test('Homepage - navigationStart to loadEventEnd < 3s', async ({ page }) => {
  44  |     await page.goto('/');
  45  |     await page.waitForLoadState('load', { timeout: 10000 });
  46  | 
  47  |     const timing = await page.evaluate(() => {
  48  |       const t = performance.getEntriesByType('navigation')[0];
  49  |       return {
  50  |         domContentLoaded: Math.round(t.domContentLoadedEventEnd),
  51  |         loadComplete:     Math.round(t.loadEventEnd),
  52  |         ttfb:             Math.round(t.responseStart - t.requestStart),
  53  |       };
  54  |     });
  55  | 
  56  |     console.log('📊 Homepage timings:', timing);
  57  |     expect(timing.loadComplete).toBeLessThan(LOAD_THRESHOLD_MS + 2000);
  58  |     expect(timing.ttfb).toBeLessThan(1000); // Time to first byte
  59  |   });
  60  | 
  61  |   test('Homepage - First Contentful Paint metric', async ({ page }) => {
  62  |     await page.goto('/');
  63  | 
  64  |     const fcp = await page.evaluate(async () => {
  65  |       return new Promise(resolve => {
  66  |         new PerformanceObserver(list => {
  67  |           for (const entry of list.getEntries()) {
  68  |             if (entry.name === 'first-contentful-paint') {
  69  |               resolve(Math.round(entry.startTime));
  70  |             }
  71  |           }
  72  |         }).observe({ type: 'paint', buffered: true });
  73  |         // Fallback if FCP not fired yet
  74  |         setTimeout(() => resolve(null), 3000);
  75  |       });
  76  |     });
  77  | 
  78  |     if (fcp !== null) {
  79  |       console.log(`📊 FCP: ${fcp}ms`);
  80  |       expect(fcp).toBeLessThan(FCP_THRESHOLD_MS);
  81  |     }
  82  |   });
  83  | 
  84  |   test('Panchang - page renders data within 3s', async ({ page }) => {
  85  |     const start = Date.now();
  86  |     await page.goto('/panchang');
  87  |     // Wait for DOM content — panchang API is CPU-intensive and varies in time
  88  |     await page.waitForLoadState('domcontentloaded', { timeout: 8000 }).catch(() => {});
  89  | 
  90  |     // Some panchang data should be visible
  91  |     await page.locator('body').waitFor({ timeout: 3000 });
  92  |     const elapsed = Date.now() - start;
  93  | 
  94  |     console.log(`📊 Panchang load: ${elapsed}ms`);
  95  |     // Allow up to 10s for panchang (astronomical calculations are CPU-intensive)
  96  |     expect(elapsed).toBeLessThan(10000);
  97  |   });
  98  | });
  99  | 
  100 | // ═══════════════════════════════════════════════════════════════════
  101 | // PART 3C: API Response Time (via page.route interception)
  102 | // ═══════════════════════════════════════════════════════════════════
  103 | test.describe('Performance: API Response Timing', () => {
  104 |   test('Health endpoint responds < 500ms', async ({ page }) => {
  105 |     let apiTime = null;
  106 | 
  107 |     // Intercept API calls and measure
  108 |     await page.route('**/api/health', async route => {
  109 |       const start = Date.now();
  110 |       const response = await route.fetch();
  111 |       apiTime = Date.now() - start;
  112 |       await route.fulfill({ response });
  113 |     });
  114 | 
  115 |     await page.goto('/');
  116 | 
  117 |     if (apiTime !== null) {
  118 |       console.log(`📊 /api/health: ${apiTime}ms`);
  119 |       expect(apiTime).toBeLessThan(API_THRESHOLD_MS);
  120 |     }
  121 |   });
  122 | 
  123 |   test('Panchang API responds < 500ms', async ({ page }) => {
  124 |     const apiTimes = [];
  125 | 
  126 |     await page.route('**/api/panchang**', async route => {
  127 |       const start = Date.now();
  128 |       const response = await route.fetch();
  129 |       apiTimes.push(Date.now() - start);
```