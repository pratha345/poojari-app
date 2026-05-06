// e2e/tests/security.spec.js — Security E2E Tests (Part 2)
const { test, expect } = require('@playwright/test');

const API_URL  = 'http://localhost:5000/api';
const APP_URL  = 'http://localhost:5173';

// ── API Helper ────────────────────────────────────────────────────
async function apiRequest(page, method, path, opts = {}) {
  return page.evaluate(async ({ method, url, body, token }) => {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }, { method, url: `${API_URL}${path}`, body: opts.body, token: opts.token });
}

// ═══════════════════════════════════════════════════════════════════
// PART 2A: Admin Routes — No Unauthenticated Access
// ═══════════════════════════════════════════════════════════════════
test.describe('Security: Admin Route Protection', () => {
  const ADMIN_ENDPOINTS = [
    '/admin/stats',
    '/admin/pujaris/pending',
    '/admin/pujaris',
    '/admin/bookings',
    '/admin/users',
  ];

  for (const endpoint of ADMIN_ENDPOINTS) {
    test(`GET ${endpoint} without token → 401`, async ({ page }) => {
      await page.goto('/');
      const result = await apiRequest(page, 'GET', endpoint);
      expect(result.status).toBe(401);
      expect(result.data.success).toBe(false);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// PART 2B: Invalid & Expired Token Handling
// ═══════════════════════════════════════════════════════════════════
test.describe('Security: Token Validation', () => {
  test('API rejects obviously fake token', async ({ page }) => {
    await page.goto('/');
    const result = await apiRequest(page, 'GET', '/auth/me', {
      token: 'definitely.not.a.real.jwt.token',
    });
    expect(result.status).toBe(401);
  });

  test('API rejects token with wrong signature', async ({ page }) => {
    await page.goto('/');
    // Valid structure but wrong secret
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJpZCI6MSwidGVuYW50X2lkIjoxLCJyb2xlIjoiYWRtaW4ifQ.' +
      'FAKESIGNATUREFAKESIGNATUREFAKESIGNATURE';

    const result = await apiRequest(page, 'GET', '/admin/stats', { token: fakeToken });
    expect(result.status).toBe(401);
  });

  test('API rejects JWT with algorithm "none"', async ({ page }) => {
    await page.goto('/');
    const header  = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' })).replace(/=/g, '');
    const payload = btoa(JSON.stringify({ id: 1, role: 'admin' })).replace(/=/g, '');
    const noneToken = `${header}.${payload}.`;

    const result = await apiRequest(page, 'GET', '/admin/stats', { token: noneToken });
    expect(result.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 2C: Security Headers
// ═══════════════════════════════════════════════════════════════════
test.describe('Security: HTTP Headers', () => {
  test('API health endpoint has security headers', async ({ page }) => {
    const response = await page.goto(`${API_URL}/health`);
    const headers  = response.headers();

    // Helmet sets these
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBeDefined();
    expect(headers['x-powered-by']).toBeUndefined(); // must NOT expose Express
  });

  test('Frontend has no mixed content (HTTPS + HTTP resources)', async ({ page }) => {
    const mixedContent = [];
    page.on('request', req => {
      // In production, check for http:// resources on an https:// page
      // In local dev, just verify no unexpected external insecure resources
      const url = req.url();
      if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
        mixedContent.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 });

    // In dev mode with localhost, mixed content is expected to be minimal
    expect(mixedContent.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 2D: XSS Attempt via URL Parameters
// ═══════════════════════════════════════════════════════════════════
test.describe('Security: XSS via URL Parameters', () => {
  const XSS_PAYLOADS = [
    '<script>alert(1)</script>',
    '"><img src=x onerror=alert(1)>',
    'javascript:alert(document.cookie)',
  ];

  XSS_PAYLOADS.forEach((payload) => {
    test(`XSS in URL parameter does not execute: ${payload.slice(0, 25)}`, async ({ page }) => {
      const alertFired = [];
      page.on('dialog', async dialog => {
        alertFired.push(dialog.message());
        await dialog.dismiss();
      });

      // Try injecting XSS via category param
      await page.goto(`/pooja/${encodeURIComponent(payload)}`);
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 });

      // Alert should NEVER fire
      expect(alertFired).toHaveLength(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 2E: SQL Injection via API
// ═══════════════════════════════════════════════════════════════════
test.describe('Security: SQL Injection via API', () => {
  const SQL_PAYLOADS = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1 UNION SELECT 1,2,3",
  ];

  SQL_PAYLOADS.forEach((payload) => {
    test(`SQL injection in login phone: ${payload.slice(0, 25)}`, async ({ page }) => {
      await page.goto('/');
      const result = await apiRequest(page, 'POST', '/auth/login', {
        body: { phone: payload, password: 'test' },
      });
      // Must not return 500 (which suggests SQL error leaked)
      expect(result.status).not.toBe(500);
      // Must not return 200 (which would mean auth bypass)
      expect(result.status).not.toBe(200);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 2F: CORS Validation
// ═══════════════════════════════════════════════════════════════════
test.describe('Security: CORS Policy', () => {
  test('API allows requests from frontend origin', async ({ page }) => {
    await page.goto('/');
    const result = await apiRequest(page, 'GET', '/health');
    expect(result.status).toBe(200);
  });

  test('Auth endpoint returns 400 for missing credentials (not 500)', async ({ page }) => {
    await page.goto('/');
    const result = await apiRequest(page, 'POST', '/auth/login', {
      body: {},
    });
    expect(result.status).toBe(400);
    expect(result.data.success).toBe(false);
  });
});
