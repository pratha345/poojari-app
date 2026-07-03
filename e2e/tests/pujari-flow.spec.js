// e2e/tests/pujari-flow.spec.js — Pujari Registration, Profile, Bookings, Nearby Search
const { test, expect } = require('@playwright/test');

const API_URL        = process.env.API_BASE_URL || 'http://localhost:5000/api';
const ADMIN_PHONE    = '9307720459';
const ADMIN_PASSWORD = 'Admin@123';

// ── Helpers ───────────────────────────────────────────────────────
async function load(page, path) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
}

async function getAdminToken(request) {
  const res  = await request.post(`${API_URL}/auth/login`, {
    data: { phone: ADMIN_PHONE, password: ADMIN_PASSWORD },
  });
  const body = await res.json();
  return body.data?.token || '';
}

async function adminLogin(page) {
  const res = await page.request.post(`${API_URL}/auth/login`, {
    data: { phone: ADMIN_PHONE, password: ADMIN_PASSWORD },
  });
  if (!res.ok()) return null;
  const body = await res.json();
  const token = body.data?.token;
  if (token) {
    await page.goto('/');
    await page.evaluate(({ tok, usr }) => {
      localStorage.setItem('pojjari_token', tok);
      localStorage.setItem('pojjari_user', JSON.stringify(usr));
    }, { tok: token, usr: body.data?.user });
  }
  return token;
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 1 — Pujari API: Public Endpoints
// ═══════════════════════════════════════════════════════════════════
test.describe('Pujari API — Public Endpoints', () => {

  test('TC-PUJ-01: GET /api/pujari/nearby returns array', async ({ request }) => {
    const res  = await request.get(`${API_URL}/pujari/nearby?lat=20.93&lng=77.75&radius=50`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('TC-PUJ-02: GET /api/pujari/nearby without lat/lng returns error', async ({ request }) => {
    const res = await request.get(`${API_URL}/pujari/nearby`);
    expect([400, 422]).toContain(res.status());
  });

  test('TC-PUJ-03: GET /api/pujari/top-reviews returns array', async ({ request }) => {
    const res  = await request.get(`${API_URL}/pujari/top-reviews`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('TC-PUJ-04: GET /api/pujari/99999 returns 404 for non-existent pujari', async ({ request }) => {
    const res = await request.get(`${API_URL}/pujari/99999`);
    expect([404, 400]).toContain(res.status());
  });

  test('TC-PUJ-05: GET /api/pujari/:id/reviews returns array', async ({ request }) => {
    // Get first pujari from nearby list
    const nearRes = await request.get(`${API_URL}/pujari/nearby?lat=20.93&lng=77.75&radius=200`);
    if (!nearRes.ok()) return test.skip();
    const nearBody = await nearRes.json();
    if (!nearBody.data?.length) return test.skip();
    const pujariId = nearBody.data[0].user_id || nearBody.data[0].id;

    const res  = await request.get(`${API_URL}/pujari/${pujariId}/reviews`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(Array.isArray(body.data)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 2 — Pujari API: Protected Endpoints
// ═══════════════════════════════════════════════════════════════════
test.describe('Pujari API — Protected Endpoints', () => {

  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
  });

  test('TC-PUJP-01: GET /api/pujari/profile without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/pujari/profile`);
    expect(res.status()).toBe(401);
  });

  test('TC-PUJP-02: GET /api/pujari/bookings without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/pujari/bookings`);
    expect(res.status()).toBe(401);
  });

  test('TC-PUJP-03: GET /api/pujari/my-services without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/pujari/my-services`);
    expect(res.status()).toBe(401);
  });

  test('TC-PUJP-04: POST /api/pujari/availability without auth returns 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/pujari/availability`, {
      data: { slots: [] },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-PUJP-05: PUT /api/pujari/bookings/:id/respond without auth returns 401', async ({ request }) => {
    const res = await request.put(`${API_URL}/pujari/bookings/1/respond`, {
      data: { action: 'accept' },
    });
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 3 — Pujari Register Page UI
// ═══════════════════════════════════════════════════════════════════
test.describe('Pujari Register Page — UI', () => {

  test('TC-PRUI-01: /pujari-register page loads', async ({ page }) => {
    await load(page, '/pujari-register');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(5);
  });

  test('TC-PRUI-02: Register form has required inputs', async ({ page }) => {
    await load(page, '/pujari-register');
    const inputs = page.locator('input, select, textarea');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(3);
  });

  test('TC-PRUI-03: Full name input present', async ({ page }) => {
    await load(page, '/pujari-register');
    const nameInput = page.locator('input[name*="name"], input[placeholder*="नाव"]').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
  });

  test('TC-PRUI-04: City input present', async ({ page }) => {
    await load(page, '/pujari-register');
    const cityInput = page.locator('input[name*="city"], input[placeholder*="शहर"]').first();
    await expect(cityInput).toBeVisible({ timeout: 5000 });
  });

  test('TC-PRUI-05: Submit without required fields shows validation', async ({ page }) => {
    await load(page, '/pujari-register');
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(800);
      // Should stay on the same page
      expect(page.url()).toContain('pujari');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 4 — Book Pujari Page
// ═══════════════════════════════════════════════════════════════════
test.describe('Book Pujari Page — UI', () => {

  test('TC-BPJ-01: /book-pujari page loads', async ({ page }) => {
    await load(page, '/book-pujari');
    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(50);
  });

  test('TC-BPJ-02: Pujari list or search form visible', async ({ page }) => {
    await load(page, '/book-pujari');
    await page.waitForTimeout(1500);
    const body = await page.textContent('body');
    expect(body).toMatch(/पुजारी|Pujari|बुक/i);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 5 — Pujari Dashboard (Protected)
// ═══════════════════════════════════════════════════════════════════
test.describe('Pujari Dashboard — Auth Guard', () => {

  test('TC-PDB-01: /pujari-dashboard without login redirects', async ({ page }) => {
    await page.goto('/pujari-dashboard');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url).not.toContain('pujari-dashboard');
  });

  test('TC-PDB-02: /pujari-dashboard/bookings without login redirects', async ({ page }) => {
    await page.goto('/pujari-dashboard/bookings');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url).not.toContain('bookings');
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 6 — Pujari Profile Public Page
// ═══════════════════════════════════════════════════════════════════
test.describe('Pujari Public Profile — UI', () => {

  test('TC-PPR-01: /pujari/99999 shows not-found gracefully', async ({ page }) => {
    await load(page, '/pujari/99999');
    await page.waitForTimeout(1500);
    const body = await page.textContent('body');
    expect(body).toMatch(/सापडला नाही|नाही|Not Found|404/i);
  });

  test('TC-PPR-02: Header visible on pujari profile page', async ({ page }) => {
    await load(page, '/pujari/99999');
    await expect(page.locator('header').first()).toBeVisible();
  });

  test('TC-PPR-03: First approved pujari profile loads if exists', async ({ request, page }) => {
    const token = await getAdminToken(request);
    if (!token) return test.skip();

    const res  = await request.get(`${API_URL}/admin/pujaris`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok()) return test.skip();
    const body = await res.json();
    const pujaris = body.data || [];
    if (!pujaris.length) return test.skip();

    const pujariId = pujaris[0].user_id || pujaris[0].id;
    await load(page, `/pujari/${pujariId}`);
    await page.waitForTimeout(1500);
    const pageText = await page.textContent('body');
    // Should show pujari name or details
    expect(pageText.length).toBeGreaterThan(100);
  });
});
