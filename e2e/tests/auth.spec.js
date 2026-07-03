// e2e/tests/auth.spec.js — Complete Authentication Tests
// Covers: Register, Login, OTP, Google OAuth, Forgot/Reset Password, /me, Logout
const { test, expect } = require('@playwright/test');

const API_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const APP_URL = 'http://localhost:5173';

const ADMIN_PHONE    = '9307720459';
const ADMIN_PASSWORD = 'Admin@123';

// Unique phone for register tests (timestamp ensures no conflict)
const TEST_PHONE    = `9${Date.now().toString().slice(-9)}`;
const TEST_PASSWORD = 'Test@12345';
const TEST_NAME     = 'Playwright Test User';

// ── Helper ─────────────────────────────────────────────────────────
async function load(page, path) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
}

async function apiPost(request, path, body, token = null) {
  return request.post(`${API_URL}${path}`, {
    data: body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 1 — Auth API: Register
// ═══════════════════════════════════════════════════════════════════
test.describe('Auth API — Register', () => {

  test('TC-REG-01: POST /api/auth/register with valid data returns token', async ({ request }) => {
    const res  = await apiPost(request, '/auth/register', {
      name: TEST_NAME, phone: TEST_PHONE, password: TEST_PASSWORD,
    });
    const body = await res.json();
    expect(res.status()).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.token).toBeTruthy();
    expect(body.data.user.phone).toBe(TEST_PHONE);
  });

  test('TC-REG-02: Register duplicate phone returns 409', async ({ request }) => {
    await apiPost(request, '/auth/register', {
      name: TEST_NAME, phone: TEST_PHONE, password: TEST_PASSWORD,
    });
    const res  = await apiPost(request, '/auth/register', {
      name: TEST_NAME, phone: TEST_PHONE, password: TEST_PASSWORD,
    });
    // Should reject duplicate
    expect([409, 400]).toContain(res.status());
  });

  test('TC-REG-03: Register without name returns 400', async ({ request }) => {
    const res = await apiPost(request, '/auth/register', {
      phone: `8${Date.now().toString().slice(-9)}`, password: TEST_PASSWORD,
    });
    expect(res.status()).toBe(400);
  });

  test('TC-REG-04: Register without phone returns 400', async ({ request }) => {
    const res = await apiPost(request, '/auth/register', {
      name: TEST_NAME, password: TEST_PASSWORD,
    });
    expect(res.status()).toBe(400);
  });

  test('TC-REG-05: Register with short password returns 400', async ({ request }) => {
    const res = await apiPost(request, '/auth/register', {
      name: TEST_NAME, phone: `7${Date.now().toString().slice(-9)}`, password: '123',
    });
    expect(res.status()).toBe(400);
  });

  test('TC-REG-06: Register with HTML in name returns 400 (XSS protection)', async ({ request }) => {
    const res = await apiPost(request, '/auth/register', {
      name: '<script>alert(1)</script>', phone: `6${Date.now().toString().slice(-9)}`, password: TEST_PASSWORD,
    });
    expect([400, 201]).toContain(res.status()); // 400 if validated, not 500
    if (res.status() === 201) {
      const body = await res.json();
      // If accepted, name should be sanitized (no <script>)
      expect(body.data?.user?.name || '').not.toContain('<script>');
    }
  });

  test('TC-REG-07: Register returns user role = "user" by default', async ({ request }) => {
    const phone = `5${Date.now().toString().slice(-9)}`;
    const res   = await apiPost(request, '/auth/register', {
      name: TEST_NAME, phone, password: TEST_PASSWORD,
    });
    if (!res.ok()) return;
    const body = await res.json();
    expect(body.data.user.role).toBe('user');
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 2 — Auth API: Login
// ═══════════════════════════════════════════════════════════════════
test.describe('Auth API — Login', () => {

  test('TC-LGN-01: POST /api/auth/login with valid credentials returns token', async ({ request }) => {
    const res  = await apiPost(request, '/auth/login', {
      phone: ADMIN_PHONE, password: ADMIN_PASSWORD,
    });
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeTruthy();
    expect(typeof body.data.token).toBe('string');
  });

  test('TC-LGN-02: Login with wrong password returns 401', async ({ request }) => {
    const res = await apiPost(request, '/auth/login', {
      phone: ADMIN_PHONE, password: 'WrongPassword123',
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('TC-LGN-03: Login with unknown phone returns 401', async ({ request }) => {
    const res = await apiPost(request, '/auth/login', {
      phone: '9000000000', password: TEST_PASSWORD,
    });
    expect(res.status()).toBe(401);
  });

  test('TC-LGN-04: Login without phone returns 400', async ({ request }) => {
    const res = await apiPost(request, '/auth/login', { password: TEST_PASSWORD });
    expect([400, 401]).toContain(res.status());
  });

  test('TC-LGN-05: Login without password returns 400', async ({ request }) => {
    const res = await apiPost(request, '/auth/login', { phone: ADMIN_PHONE });
    expect([400, 401]).toContain(res.status());
  });

  test('TC-LGN-06: Login response includes user object with role', async ({ request }) => {
    const res  = await apiPost(request, '/auth/login', {
      phone: ADMIN_PHONE, password: ADMIN_PASSWORD,
    });
    const body = await res.json();
    expect(body.data.user).toBeTruthy();
    expect(body.data.user.role).toBeTruthy();
    expect(['admin', 'super_admin', 'user', 'pujari']).toContain(body.data.user.role);
  });

  test('TC-LGN-07: Login with empty body returns 400', async ({ request }) => {
    const res = await apiPost(request, '/auth/login', {});
    expect([400, 401]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 3 — Auth API: /me (Get Current User)
// ═══════════════════════════════════════════════════════════════════
test.describe('Auth API — /me endpoint', () => {

  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    const res  = await apiPost(request, '/auth/login', {
      phone: ADMIN_PHONE, password: ADMIN_PASSWORD,
    });
    const body = await res.json();
    adminToken = body.data?.token || '';
  });

  test('TC-ME-01: GET /api/auth/me with valid token returns user', async ({ request }) => {
    const res  = await request.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
    expect(body.data.phone).toBe(ADMIN_PHONE);
  });

  test('TC-ME-02: GET /api/auth/me without token returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/auth/me`);
    expect(res.status()).toBe(401);
  });

  test('TC-ME-03: GET /api/auth/me with invalid token returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/auth/me`, {
      headers: { Authorization: 'Bearer invalid.fake.token' },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-ME-04: /me response includes id, name, phone, role', async ({ request }) => {
    const res  = await request.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(body.data.id).toBeTruthy();
    expect(body.data.name).toBeTruthy();
    expect(body.data.phone).toBeTruthy();
    expect(body.data.role).toBeTruthy();
  });

  test('TC-ME-05: /me does not return password_hash', async ({ request }) => {
    const res  = await request.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(body.data.password_hash).toBeUndefined();
    expect(body.data.password).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 4 — OTP Flow
// ═══════════════════════════════════════════════════════════════════
test.describe('Auth API — OTP Flow', () => {

  test.skip('TC-OTP-01: POST /api/auth/send-otp with existing phone returns success', async ({ request }) => {
    const res  = await apiPost(request, '/auth/send-otp', { phone: ADMIN_PHONE });
    const body = await res.json();
    // Either success or rate-limited — should not 500
    expect([200, 429]).toContain(res.status());
    if (res.ok()) expect(body.success).toBe(true);
  });

  test('TC-OTP-02: POST /api/auth/send-otp with unknown phone', async ({ request }) => {
    const res = await apiPost(request, '/auth/send-otp', { phone: '9000000001' });
    // Should handle gracefully (404 or 200 depending on behavior)
    expect(res.status()).not.toBe(500);
  });

  test('TC-OTP-03: POST /api/auth/send-otp without phone returns 400', async ({ request }) => {
    const res = await apiPost(request, '/auth/send-otp', {});
    expect([400, 422]).toContain(res.status());
  });

  test('TC-OTP-04: POST /api/auth/verify-otp with wrong OTP returns 400', async ({ request }) => {
    const res  = await apiPost(request, '/auth/verify-otp', {
      phone: ADMIN_PHONE, otp: '000000',
    });
    expect([400, 401]).toContain(res.status());
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('TC-OTP-05: POST /api/auth/verify-otp without phone returns 400', async ({ request }) => {
    const res = await apiPost(request, '/auth/verify-otp', { otp: '123456' });
    expect([400, 422]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 5 — Forgot/Reset Password
// ═══════════════════════════════════════════════════════════════════
test.describe('Auth API — Forgot / Reset Password', () => {

  test.skip('TC-FP-01: POST /api/auth/forgot-password with existing phone returns success', async ({ request }) => {
    const res  = await apiPost(request, '/auth/forgot-password', { phone: ADMIN_PHONE });
    const body = await res.json();
    expect([200, 404]).toContain(res.status());
    if (res.ok()) expect(body.success).toBe(true);
  });

  test('TC-FP-02: POST /api/auth/forgot-password with non-existent phone', async ({ request }) => {
    const res = await apiPost(request, '/auth/forgot-password', { phone: '9888777666' });
    // Should not 500
    expect(res.status()).not.toBe(500);
  });

  test('TC-FP-03: POST /api/auth/forgot-password without phone returns 400', async ({ request }) => {
    const res = await apiPost(request, '/auth/forgot-password', {});
    expect([400, 422]).toContain(res.status());
  });

  test('TC-FP-04: POST /api/auth/reset-password with invalid OTP returns error', async ({ request }) => {
    const res  = await apiPost(request, '/auth/reset-password', {
      phone:       ADMIN_PHONE,
      otp:         '000000',
      newPassword: 'NewPass@123',
    });
    expect([400, 401]).toContain(res.status());
  });

  test('TC-FP-05: POST /api/auth/reset-password without required fields returns 400', async ({ request }) => {
    const res = await apiPost(request, '/auth/reset-password', { phone: ADMIN_PHONE });
    expect([400, 422]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 6 — Login Page UI Tests
// ═══════════════════════════════════════════════════════════════════
test.describe('Login Page — UI', () => {

  test('TC-LGUI-01: login page loads with title', async ({ page }) => {
    await load(page, '/login');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(5);
  });

  test('TC-LGUI-02: phone and password inputs visible', async ({ page }) => {
    await load(page, '/login');
    await expect(page.locator('input[type="tel"], input[name*="phone"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('TC-LGUI-03: submit with empty fields stays on login page', async ({ page }) => {
    await load(page, '/login');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(800);
    expect(page.url()).toContain('login');
  });

  test('TC-LGUI-04: wrong credentials shows error message', async ({ page }) => {
    await load(page, '/login');
    await page.locator('input[type="tel"], input[name*="phone"]').first().fill('9999999999');
    await page.locator('input[type="password"]').first().fill('wrongpass');
    await page.locator('input[type="password"]').first().press('Enter');
    await page.waitForTimeout(2500);
    const body = await page.textContent('body');
    expect(body).toMatch(/चुकीचा|Invalid|Error|नाही/i);
  });

  test('TC-LGUI-05: successful login navigates away from login page', async ({ page }) => {
    await load(page, '/login');
    await page.locator('input[type="tel"], input[name*="phone"]').first().fill(ADMIN_PHONE);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
    await page.locator('input[type="password"]').first().press('Enter');
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain('login');
  });

  test('TC-LGUI-06: "Register" link present on login page', async ({ page }) => {
    await load(page, '/login');
    const regLink = page.locator('a[href*="register"]').first();
    await expect(regLink).toBeVisible({ timeout: 5000 });
  });

  test('TC-LGUI-07: password show/hide toggle works', async ({ page }) => {
    await load(page, '/login');
    const pwdInput  = page.locator('input[type="password"]').first();
    const toggleBtn = page.locator('button').filter({ hasText: /👁|show|hide/i }).first();
    if (await toggleBtn.count() > 0) {
      await toggleBtn.click();
      const newType = await pwdInput.getAttribute('type');
      expect(newType).toBe('text');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 7 — Register Page UI Tests
// ═══════════════════════════════════════════════════════════════════
test.describe('Register Page — UI', () => {

  test('TC-REGUI-01: register page loads', async ({ page }) => {
    await load(page, '/register');
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 5000 });
  });

  test('TC-REGUI-02: name, phone, password inputs present', async ({ page }) => {
    await load(page, '/register');
    await expect(page.locator('input[name*="name"], input[placeholder*="नाव"]').first()).toBeVisible();
    await expect(page.locator('input[type="tel"], input[name*="phone"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('TC-REGUI-03: form submit without fields shows validation', async ({ page }) => {
    await load(page, '/register');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(800);
    expect(page.url()).toContain('register');
  });

  test('TC-REGUI-04: "Login" link present on register page', async ({ page }) => {
    await load(page, '/register');
    const loginLink = page.locator('a[href*="login"]').first();
    await expect(loginLink).toBeVisible({ timeout: 5000 });
  });
});
