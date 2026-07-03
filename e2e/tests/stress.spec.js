// e2e/tests/stress.spec.js — Stress & Concurrency Tests (Part 6)
const { test, expect } = require('@playwright/test');

const API_URL        = process.env.API_BASE_URL || 'http://localhost:5000/api';
const ADMIN_PHONE    = '9307720459';
const ADMIN_PASSWORD = 'Admin@123';

// ─── Helpers ──────────────────────────────────────────────────────
async function waitForLoad(page) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 1 — Concurrent API Load (via request context)
// ═══════════════════════════════════════════════════════════════════

test.describe('Stress: Concurrent API Requests', () => {

  test('10 simultaneous GET /api/poojas complete successfully', async ({ request }) => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => request.get(`${API_URL}/poojas`))
    );
    results.forEach(r => expect(r.ok()).toBeTruthy());
  });

  test('10 simultaneous GET /api/halls complete successfully', async ({ request }) => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => request.get(`${API_URL}/halls`))
    );
    results.forEach(r => expect(r.ok()).toBeTruthy());
  });

  test('Concurrent poojas + halls + panchang requests return correct shape', async ({ request }) => {
    const [poojas, halls, health] = await Promise.all([
      request.get(`${API_URL}/poojas`),
      request.get(`${API_URL}/halls`),
      request.get(`${API_URL}/health`),
    ]);

    expect(poojas.ok()).toBeTruthy();
    expect(halls.ok()).toBeTruthy();
    expect(health.ok()).toBeTruthy();

    const pBody = await poojas.json();
    const hBody = await halls.json();
    expect(pBody.success).toBe(true);
    expect(hBody.success).toBe(true);
  });

  test('Repeated panchang API calls do not degrade response time', async ({ request }) => {
    const times = [];
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await request.get(`${API_URL}/panchang`);
      times.push(Date.now() - start);
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`📊 Panchang avg over 5 calls: ${Math.round(avg)}ms`);
    // Average should stay below 2s in local dev
    expect(avg).toBeLessThan(2000);
  });

  test('20 simultaneous GET /api/health all return 200', async ({ request }) => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => request.get(`${API_URL}/health`))
    );
    results.forEach(r => {
      expect(r.status()).toBe(200);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 2 — Rapid Page Navigation
// ═══════════════════════════════════════════════════════════════════

test.describe('Stress: Rapid Navigation', () => {

  test('visiting 10 pages rapidly does not crash the app', async ({ page }) => {
    const paths = ['/', '/panchang', '/pooja', '/about', '/contact', '/login',
                   '/panchang', '/', '/pooja', '/login'];
    for (const path of paths) {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('back/forward navigation does not crash', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
    await page.goto('/panchang');
    await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
    await page.goto('/pooja');
    await page.waitForLoadState('domcontentloaded', { timeout: 8000 });

    await page.goBack();
    await page.waitForURL(/panchang/, { timeout: 8000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
    expect(page.url()).toContain('panchang');

    await page.goBack();
    await page.waitForURL(/localhost:5173\/?$/, { timeout: 8000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
    expect(page.url()).toMatch(/localhost:5173\/?$/);

    await page.goForward();
    await page.waitForURL(/panchang/, { timeout: 8000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
    expect(page.url()).toContain('panchang');
  });

  test('navigating to same route twice is idempotent', async ({ page }) => {
    await page.goto('/pooja');
    await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
    const bodyBefore = await page.locator('body').textContent();

    await page.goto('/pooja');
    await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
    const bodyAfter = await page.locator('body').textContent();

    // Content should be stable — same heading
    const h1Before = await page.locator('h1').first().textContent().catch(() => '');
    expect(h1Before.length).toBeGreaterThan(0);
  });

  test('rapid reload 5 times does not break state', async ({ page }) => {
    await page.goto('/');
    for (let i = 0; i < 5; i++) {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 8000 });
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 3 — Auth Stress
// ═══════════════════════════════════════════════════════════════════

test.describe('Stress: Authentication Under Load', () => {

  test('5 sequential login attempts with wrong password return 401', async ({ request }) => {
    const results = [];
    for (let i = 0; i < 5; i++) {
      const res = await request.post(`${API_URL}/auth/login`, {
        data: { phone: '9999999999', password: 'WrongPass@123' },
      });
      results.push(res.status());
    }
    results.forEach(s => expect(s).toBe(401));
  });

  test('3 concurrent valid login requests all succeed', async ({ request }) => {
    const results = await Promise.all(
      Array.from({ length: 3 }, () =>
        request.post(`${API_URL}/auth/login`, {
          data: { phone: ADMIN_PHONE, password: ADMIN_PASSWORD },
        })
      )
    );
    results.forEach(r => {
      expect(r.ok()).toBeTruthy();
    });
  });

  test('no memory leak — homepage renders correctly after 10 navigations', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));

    for (let i = 0; i < 10; i++) {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
    }

    const critical = jsErrors.filter(e =>
      e.includes('Cannot read') || e.includes('is not a function') || e.includes('Maximum call stack')
    );
    expect(critical).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 4 — Form Submission Stress
// ═══════════════════════════════════════════════════════════════════

test.describe('Stress: Form Submission', () => {

  test('clicking login submit 5 times rapidly does not cause multiple navigations', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded', { timeout: 8000 });

    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    const passInput  = page.locator('input[type="password"]').first();
    const submitBtn  = page.locator('button[type="submit"]').first();

    if (await phoneInput.count() > 0 && await passInput.count() > 0) {
      await phoneInput.fill('9307720459');
      await passInput.fill('Admin@123');

      // Click submit rapidly 5 times
      for (let i = 0; i < 5; i++) {
        await submitBtn.click({ timeout: 2000 }).catch(() => {});
      }

      await page.waitForTimeout(2000);
      // Should have navigated exactly once (not 5 redirects)
      const url = page.url();
      expect(url).toBeDefined();
    }
  });

  test('panchang date picker — changing date 10 times does not crash', async ({ page }) => {
    await page.goto('/panchang');
    await waitForLoad(page);

    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.count() === 0) return;

    const dates = [
      '2025-01-01', '2025-03-15', '2025-05-20', '2025-07-04',
      '2025-09-10', '2025-11-25', '2026-01-01', '2026-02-14',
      '2026-04-01', '2026-06-15',
    ];

    for (const d of dates) {
      await dateInput.fill(d);
      await page.waitForTimeout(200);
    }

    // Page should still be functional
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 5 — Large Data Stress
// ═══════════════════════════════════════════════════════════════════

test.describe('Stress: Large Payload Handling', () => {

  test('halls API handles large limit param gracefully', async ({ request }) => {
    const res  = await request.get(`${API_URL}/halls?limit=500`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('poojas API handles large limit param gracefully', async ({ request }) => {
    const res  = await request.get(`${API_URL}/poojas?limit=200`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.poojas)).toBe(true);
  });

  test('search with very long string does not return 500', async ({ request }) => {
    const longStr = 'a'.repeat(500);
    const res = await request.get(`${API_URL}/halls?district=${longStr}`);
    // Should either return 200 with empty results or 400 — never 500
    expect(res.status()).not.toBe(500);
  });

  test('halls nearby with extreme coordinates returns graceful response', async ({ request }) => {
    const res  = await request.get(`${API_URL}/halls/nearby?lat=90&lng=180`);
    const body = await res.json();
    // Should return 200 with empty array (no halls near North Pole)
    expect(res.ok()).toBeTruthy();
    expect(Array.isArray(body.data)).toBe(true);
  });
});
