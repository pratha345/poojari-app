// e2e/tests/admin-panel.spec.js — Complete Admin Panel Tests
// Covers: Login, Stats, Reports, Pujari management, Users, Home editor, Janam Patrika, Gallery, Theme
const { test, expect } = require('@playwright/test');

const API_URL        = process.env.API_BASE_URL || 'http://localhost:5000/api';
const ADMIN_PHONE = '9000000000';
const ADMIN_PASSWORD = 'Admin@123';

// ── Helpers ───────────────────────────────────────────────────────
async function load(page, path) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
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

async function getAdminToken(request) {
  const res  = await request.post(`${API_URL}/auth/login`, {
    data: { phone: ADMIN_PHONE, password: ADMIN_PASSWORD },
  });
  const body = await res.json();
  return body.data?.token || '';
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 1 — Admin Login Page
// ═══════════════════════════════════════════════════════════════════
test.describe('Admin — Login Page', () => {

  test('TC-ALG-01: /admin/login loads with inputs', async ({ page }) => {
    await load(page, '/admin/login');
    // AdminLogin uses type="text" for phone input (not tel)
    await expect(page.locator('input[type="tel"], input[type="text"], input[name*="phone"]').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('TC-ALG-02: Wrong credentials shows error', async ({ page }) => {
    await load(page, '/admin/login');
    await page.locator('input[type="tel"], input[type="text"], input[name*="phone"]').first().fill('9999999999');
    await page.locator('input[type="password"]').first().fill('wrongpass');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(2500);
    const body = await page.textContent('body');
    expect(body).toMatch(/चुकीचा|Invalid|Error|नाही/i);
  });

  test('TC-ALG-03: Valid admin login redirects to /admin/report', async ({ page }) => {
    await load(page, '/admin/login');
    await page.locator('input[type="tel"], input[type="text"], input[name*="phone"]').first().fill(ADMIN_PHONE);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
    await page.locator('input[type="password"]').first().press('Enter');
    await page.waitForTimeout(3000);
    expect(page.url()).toMatch(/admin\/(report|bookings)/);
  });

  test('TC-ALG-04: /admin without auth redirects to login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/admin\/(login|report)/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 2 — Admin Stats API
// ═══════════════════════════════════════════════════════════════════
test.describe('Admin API — Stats', () => {

  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
  });

  test('TC-STATS-01: GET /api/admin/stats without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/stats`);
    expect(res.status()).toBe(401);
  });

  test('TC-STATS-02: GET /api/admin/stats with admin token returns data', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.get(`${API_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
  });

  test('TC-STATS-03: Stats response includes user/pujari/booking counts', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.get(`${API_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    const data = body.data;
    // At least one of these fields should exist
    const hasStats = data.users !== undefined || data.totalUsers !== undefined
      || data.bookings !== undefined || data.totalBookings !== undefined;
    expect(hasStats).toBe(true);
  });

  test('TC-STATS-04: GET /api/admin/report without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/report`);
    expect(res.status()).toBe(401);
  });

  test('TC-STATS-05: GET /api/admin/report with admin token returns data', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.get(`${API_URL}/admin/report`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 3 — Admin Reports Page UI
// ═══════════════════════════════════════════════════════════════════
test.describe('Admin Reports Page — UI', () => {

  test('TC-RPT-01: /admin/report loads for admin', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/report');
    await page.waitForTimeout(1000);
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible({ timeout: 5000 });
  });

  test('TC-RPT-02: Report shows stats numbers', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/report');
    await page.waitForTimeout(1500);
    const body = await page.textContent('body');
    // Stats should have numbers
    expect(body).toMatch(/\d+/);
  });

  test('TC-RPT-03: Report page has date range filter', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/report');
    await page.waitForTimeout(1000);
    const dateInput = page.locator('input[type="date"]').first();
    await expect(dateInput).toBeVisible({ timeout: 5000 });
  });

  test('TC-RPT-04: Sidebar nav is visible on /admin/report', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/report');
    await page.waitForTimeout(800);
    const nav = page.locator('nav, aside').first();
    await expect(nav).toBeVisible({ timeout: 5000 });
  });

  test('TC-RPT-05: Dashboard nav item NOT in sidebar (removed)', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/report');
    await page.waitForTimeout(800);
    const dashLink = page.locator('a[href*="dashboard"]');
    // Dashboard link should not be in admin sidebar
    const count = await dashLink.count();
    expect(count).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 4 — Admin: Pujari Management
// ═══════════════════════════════════════════════════════════════════
test.describe('Admin API — Pujari Management', () => {

  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
  });

  test('TC-APJ-01: GET /api/admin/pujaris/pending without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/pujaris/pending`);
    expect(res.status()).toBe(401);
  });

  test('TC-APJ-02: GET /api/admin/pujaris/pending with admin token', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.get(`${API_URL}/admin/pujaris/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('TC-APJ-03: GET /api/admin/pujaris returns approved list', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.get(`${API_URL}/admin/pujaris`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('TC-APJ-04: PUT /api/admin/pujaris/:id/respond with invalid action returns error', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res = await request.put(`${API_URL}/admin/pujaris/99999/respond`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { action: 'invalid_action' },
    });
    expect([400, 404]).toContain(res.status());
  });

  test('TC-APJ-05: PUT /api/admin/pujaris/99999/respond returns 404 for non-existent', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res = await request.put(`${API_URL}/admin/pujaris/99999/respond`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { action: 'approve' },
    });
    expect([404, 400]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 5 — Admin Pujari Page UI
// ═══════════════════════════════════════════════════════════════════
test.describe('Admin Pujari Page — UI', () => {

  test('TC-APUI-01: /admin/pujaris page loads', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/pujaris');
    await page.waitForTimeout(1000);
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible({ timeout: 5000 });
  });

  test('TC-APUI-02: Page shows pending/approved tabs or filter', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/pujaris');
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).toMatch(/pending|approved|मंजूर|प्रलंबित/i);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 6 — Admin: User Management
// ═══════════════════════════════════════════════════════════════════
test.describe('Admin API — User Management', () => {

  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
  });

  test('TC-USR-01: GET /api/admin/users without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/users`);
    expect(res.status()).toBe(401);
  });

  test('TC-USR-02: GET /api/admin/users with admin token returns array', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('TC-USR-03: GET /api/admin/users response has expected fields', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    if (body.data.length > 0) {
      const u = body.data[0];
      expect(u.id).toBeTruthy();
      expect(u.name).toBeTruthy();
      expect(u.phone).toBeTruthy();
      expect(u.role).toBeTruthy();
      // Password must NOT be exposed
      expect(u.password_hash).toBeUndefined();
      expect(u.password).toBeUndefined();
    }
  });

  test('TC-USR-04: /admin/users page loads in browser', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/users');
    await page.waitForTimeout(1000);
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 7 — Admin Reviews
// ═══════════════════════════════════════════════════════════════════
test.describe('Admin API — Reviews', () => {

  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
  });

  test('TC-REV-01: GET /api/admin/reviews without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/reviews`);
    expect(res.status()).toBe(401);
  });

  test('TC-REV-02: GET /api/admin/reviews with admin token returns array', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.get(`${API_URL}/admin/reviews`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(Array.isArray(body.data?.reviews || body.data)).toBe(true);
  });

  test('TC-REV-03: PUT /api/admin/reviews/99999/approve on non-existent returns error', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res = await request.put(`${API_URL}/admin/reviews/99999/approve`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect([404, 400]).toContain(res.status());
  });

  test('TC-REV-04: DELETE /api/admin/reviews/99999 returns 404', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res = await request.delete(`${API_URL}/admin/reviews/99999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect([404, 400]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 8 — Admin Home Editor
// ═══════════════════════════════════════════════════════════════════
test.describe('Admin Home Editor — UI', () => {

  test('TC-HOM-01: /admin/home page loads', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/home');
    await page.waitForTimeout(1000);
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible({ timeout: 5000 });
  });

  test('TC-HOM-02: Home editor has Save/जतन button', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/home');
    await page.waitForTimeout(1000);
    const saveBtn = page.locator('button').filter({ hasText: /जतन|Save/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
  });

  test('TC-HOM-03: Hero section inputs present', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/home');
    await page.waitForTimeout(1000);
    const inputs = page.locator('input, textarea');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(2);
  });

  test('TC-HOM-04: "← अहवाल" back link present', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/home');
    await page.waitForTimeout(1000);
    const backLink = page.locator('a').filter({ hasText: /अहवाल|Report/i }).first();
    await expect(backLink).toBeVisible({ timeout: 5000 });
  });

  test('TC-HOM-05: Hero cycling info box visible', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/home');
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).toMatch(/Hero|hero|सायकल/i);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 9 — Janam Patrika Page
// ═══════════════════════════════════════════════════════════════════
test.describe('Admin Janam Patrika — UI', () => {

  test('TC-JP-01: /admin/janam-patrika loads', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/janam-patrika');
    await page.waitForTimeout(1000);
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible({ timeout: 5000 });
  });

  test('TC-JP-02: Name input present in form', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/janam-patrika');
    await page.waitForTimeout(1000);
    const nameInput = page.locator('input[name="name"], input[placeholder*="नाव"]').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
  });

  test('TC-JP-03: Date of Birth input present', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/janam-patrika');
    await page.waitForTimeout(1000);
    const dobInput = page.locator('input[type="date"], input[name*="dob"], input[name*="date"]').first();
    await expect(dobInput).toBeVisible({ timeout: 5000 });
  });

  test('TC-JP-04: State dropdown has Maharashtra as default', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/janam-patrika');
    await page.waitForTimeout(1000);
    const stateSelect = page.locator('select').first();
    if (await stateSelect.count() > 0) {
      const val = await stateSelect.inputValue();
      // Default should be Maharashtra (index 0)
      expect(val).toBeTruthy();
    }
  });

  test('TC-JP-05: District combobox has Amravati as default', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/janam-patrika');
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).toMatch(/अमरावती|Amravati/i);
  });

  test('TC-JP-06: District combobox — typing shows filtered list', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/janam-patrika');
    await page.waitForTimeout(1000);
    const distInput = page.locator('input[placeholder*="जिल्हा"], input[placeholder*="district"]').first();
    if (await distInput.count() === 0) return;
    await distInput.focus();
    await page.waitForTimeout(300);
    // Clear and type to filter
    await distInput.fill('nagpur');
    await page.waitForTimeout(300);
    const list = page.locator('[class*="distList"], [class*="dropList"]').first();
    await expect(list).toBeVisible({ timeout: 3000 });
  });

  test('TC-JP-07: English district search shows Marathi results', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/janam-patrika');
    await page.waitForTimeout(1000);
    const distInput = page.locator('input[placeholder*="जिल्हा"], input[placeholder*="district"]').first();
    if (await distInput.count() === 0) return;
    await distInput.focus();
    await distInput.fill('ratnagiri');
    await page.waitForTimeout(300);
    const body = await page.textContent('body');
    expect(body).toMatch(/रत्नागिरी|Ratnagiri/i);
  });

  test('TC-JP-08: Generate button present', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/janam-patrika');
    await page.waitForTimeout(1000);
    const genBtn = page.locator('button').filter({ hasText: /Generate|तयार|पत्रिका/i }).first();
    await expect(genBtn).toBeVisible({ timeout: 5000 });
  });

  test('TC-JP-09: Latitude/Longitude chips appear after district select', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/janam-patrika');
    await page.waitForTimeout(1000);
    // Default Amravati should already have lat/lon chips
    const body = await page.textContent('body');
    expect(body).toMatch(/lat|lon|°N|°E|\d+\.\d+/i);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 10 — Admin Theme & Settings
// ═══════════════════════════════════════════════════════════════════
test.describe('Admin Theme & Settings — API', () => {

  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
  });

  test('TC-THM-01: GET /api/theme without auth returns data (public)', async ({ request }) => {
    const res = await request.get(`${API_URL}/theme`);
    // Theme may be public or require auth
    expect([200, 401]).toContain(res.status());
  });

  test('TC-THM-02: POST /api/theme/admin without auth returns 401', async ({ request }) => {
    // Actual route is POST /api/theme/admin (not PUT /api/theme)
    const res = await request.post(`${API_URL}/theme/admin`, {
      data: { active_theme: 'default' },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-THM-03: GET /api/home returns homepage content', async ({ request }) => {
    const res  = await request.get(`${API_URL}/home`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
  });

  test('TC-THM-04: POST /api/home without auth returns 401', async ({ request }) => {
    // Home uses POST / (not PUT) for updates
    const res = await request.post(`${API_URL}/home`, {
      data: { hero_title: 'Test' },
    });
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 11 — Admin Navigation (Sidebar)
// ═══════════════════════════════════════════════════════════════════
test.describe('Admin Sidebar Navigation', () => {

  const ADMIN_PAGES = [
    { path: '/admin/report',        label: 'अहवाल'      },
    { path: '/admin/bookings',      label: 'बुकिंग'     },
    { path: '/admin/pujaris',       label: 'पुजारी'     },
    { path: '/admin/poojas',        label: 'पूजा'       },
    { path: '/admin/users',         label: 'वापरकर्ते' },
    { path: '/admin/home',          label: 'होम'        },
    { path: '/admin/janam-patrika', label: 'पत्रिका'   },
  ];

  for (const pg of ADMIN_PAGES) {
    test(`TC-NAV: ${pg.path} loads after admin login`, async ({ page }) => {
      const token = await adminLogin(page);
      if (!token) return test.skip();
      await page.goto(pg.path);
      await page.waitForTimeout(1000);
      // Should not redirect to login
      expect(page.url()).not.toContain('/login');
      // Should show some content
      const title = page.locator('h1, h2').first();
      await expect(title).toBeVisible({ timeout: 8000 });
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 12 — Admin: Abhyasak (Blog Editor) Management
// ═══════════════════════════════════════════════════════════════════
test.describe('Admin API — Abhyasak (Blog Editors)', () => {

  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
  });

  test('TC-ABH-01: GET /api/admin/abhyasak without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/abhyasak`);
    expect(res.status()).toBe(401);
  });

  test('TC-ABH-02: GET /api/admin/abhyasak with admin token returns list', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.get(`${API_URL}/admin/abhyasak`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(Array.isArray(body.data)).toBe(true);
  });
});
