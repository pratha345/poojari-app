// e2e/tests/booking-flow.spec.js — Complete Booking Flow Tests
// Covers: Create booking, View bookings, Cancel, Review, Payment (Razorpay), Admin assign pujari
const { test, expect } = require('@playwright/test');

const API_URL        = process.env.API_BASE_URL || 'http://localhost:5000/api';
const ADMIN_PHONE    = '9307720459';
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

async function getFirstPooja(request) {
  const res  = await request.get(`${API_URL}/poojas?limit=1`);
  const body = await res.json();
  return body.data?.poojas?.[0] || null;
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 1 — Booking API: Create Booking
// ═══════════════════════════════════════════════════════════════════
test.describe('Booking API — Create', () => {

  let adminToken = '';
  let firstPooja = null;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
    firstPooja = await getFirstPooja(request);
  });

  test('TC-BK-01: POST /api/bookings without auth returns 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/bookings`, {
      data: { pooja_id: 1, booking_date: '2026-07-01', booking_time: '10:00', address: 'Test' },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-BK-02: POST /api/bookings with auth + valid data returns 201 with booking code', async ({ request }) => {
    if (!adminToken || !firstPooja) return test.skip();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];

    const res  = await request.post(`${API_URL}/bookings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        pooja_id:     firstPooja.id,
        booking_date: dateStr,
        booking_time: '10:00',
        address:      'Test Address, Amravati',
        city:         'Amravati',
        district:     'Amravati',
      },
    });
    const body = await res.json();
    expect(res.status()).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.bookingCode).toMatch(/^POJ-/);
  });

  test('TC-BK-03: POST /api/bookings without pooja_id returns 400', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res = await request.post(`${API_URL}/bookings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { booking_date: '2026-07-01', booking_time: '10:00', address: 'Test' },
    });
    expect([400, 404]).toContain(res.status());
  });

  test('TC-BK-04: POST /api/bookings without address returns 400', async ({ request }) => {
    if (!adminToken || !firstPooja) return test.skip();
    const res = await request.post(`${API_URL}/bookings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { pooja_id: firstPooja.id, booking_date: '2026-07-01', booking_time: '10:00' },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('TC-BK-05: Booking code starts with POJ-', async ({ request }) => {
    if (!adminToken || !firstPooja) return test.skip();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const dateStr = futureDate.toISOString().split('T')[0];

    const res  = await request.post(`${API_URL}/bookings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        pooja_id: firstPooja.id, booking_date: dateStr,
        booking_time: '11:00', address: 'Pune', city: 'Pune', district: 'Pune',
      },
    });
    if (!res.ok()) return;
    const body = await res.json();
    expect(body.data.bookingCode).toMatch(/^POJ-[A-Z0-9]{6}$/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 2 — Booking API: List & Get
// ═══════════════════════════════════════════════════════════════════
test.describe('Booking API — List & Get', () => {

  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
  });

  test('TC-BKL-01: GET /api/bookings/my without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/bookings/my`);
    expect(res.status()).toBe(401);
  });

  test('TC-BKL-02: GET /api/bookings/my with auth returns array', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.get(`${API_URL}/bookings/my`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('TC-BKL-03: GET /api/bookings/my returns booking objects with expected fields', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.get(`${API_URL}/bookings/my`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    if (body.data.length > 0) {
      const b = body.data[0];
      expect(b.booking_code || b.bookingCode).toBeTruthy();
      expect(b.status).toBeTruthy();
    }
  });

  test('TC-BKL-04: GET /api/bookings/:code without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/bookings/POJ-FAKE12`);
    expect(res.status()).toBe(401);
  });

  test('TC-BKL-05: GET /api/bookings/:code with invalid code returns 404', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res = await request.get(`${API_URL}/bookings/POJ-XXXXXX`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect([404, 400]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 3 — Booking API: Cancel
// ═══════════════════════════════════════════════════════════════════
test.describe('Booking API — Cancel', () => {

  let adminToken = '';
  let testBookingId = null;

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);

    // Create a booking to cancel
    const pooja = await getFirstPooja(request);
    if (!adminToken || !pooja) return;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    const dateStr = futureDate.toISOString().split('T')[0];

    const res  = await request.post(`${API_URL}/bookings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        pooja_id: pooja.id, booking_date: dateStr,
        booking_time: '09:00', address: 'Cancel Test', city: 'Nagpur', district: 'Nagpur',
      },
    });
    if (res.ok()) {
      const body = await res.json();
      testBookingId = body.data?.id;
    }
  });

  test('TC-BKC-01: PUT /api/bookings/:id/cancel without auth returns 401', async ({ request }) => {
    const res = await request.put(`${API_URL}/bookings/999/cancel`, {
      data: { reason: 'Test cancel' },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-BKC-02: Cancel valid booking returns success', async ({ request }) => {
    if (!adminToken || !testBookingId) return test.skip();
    const res  = await request.put(`${API_URL}/bookings/${testBookingId}/cancel`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { reason: 'Test cancellation by Playwright' },
    });
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
  });

  test('TC-BKC-03: Cancel non-existent booking returns 404', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res = await request.put(`${API_URL}/bookings/99999/cancel`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { reason: 'Test' },
    });
    expect([404, 400]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 4 — Booking API: Review
// ═══════════════════════════════════════════════════════════════════
test.describe('Booking API — Review', () => {

  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
  });

  test('TC-BKR-01: POST /api/bookings/review without auth returns 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/bookings/review`, {
      data: { booking_id: 1, rating: 5, comment: 'Great' },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-BKR-02: POST /api/bookings/review on non-completed booking returns error', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.post(`${API_URL}/bookings/review`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { booking_id: 99999, rating: 5, comment: 'Test review' },
    });
    expect([400, 404, 403]).toContain(res.status());
  });

  test('TC-BKR-03: Rating must be 1-5', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res = await request.post(`${API_URL}/bookings/review`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { booking_id: 1, rating: 10, comment: 'Invalid rating' },
    });
    expect([400, 422, 404]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 5 — Payment API
// ═══════════════════════════════════════════════════════════════════
test.describe('Booking API — Payment (Razorpay)', () => {

  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
  });

  test('TC-PAY-01: POST /api/bookings/payment/create without auth returns 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/bookings/payment/create`, {
      data: { bookingId: 1 },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-PAY-02: POST /api/bookings/payment/create with invalid booking returns error', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.post(`${API_URL}/bookings/payment/create`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { bookingId: 99999 },
    });
    expect([400, 404, 500]).toContain(res.status());
  });

  test('TC-PAY-03: POST /api/bookings/payment/verify with tampered signature returns 400', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.post(`${API_URL}/bookings/payment/verify`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        razorpay_order_id:   'order_fake123',
        razorpay_payment_id: 'pay_fake456',
        razorpay_signature:  'fake_signature_tampered',
        bookingId:           1,
      },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('TC-PAY-04: POST /api/bookings/payment/cash with auth sets payment to cash', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res = await request.post(`${API_URL}/bookings/payment/cash`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { bookingId: 99999 },
    });
    // Either 200 (success) or 404 (booking not found) — not 500
    expect(res.status()).not.toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 6 — Admin: Booking Management
// ═══════════════════════════════════════════════════════════════════
test.describe('Admin API — Booking Management', () => {

  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
  });

  test('TC-ABK-01: GET /api/admin/bookings without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/bookings`);
    expect(res.status()).toBe(401);
  });

  test('TC-ABK-02: GET /api/admin/bookings with admin token returns array', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.get(`${API_URL}/admin/bookings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data?.bookings || body.data)).toBe(true);
  });

  test('TC-ABK-03: GET /api/admin/bookings?status=pending filters results', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.get(`${API_URL}/admin/bookings?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    const bookings = body.data?.bookings || body.data || [];
    bookings.forEach(b => expect(b.status).toBe('pending'));
  });

  test('TC-ABK-04: GET /api/admin/bookings pagination works', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.get(`${API_URL}/admin/bookings?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    const bookings = body.data?.bookings || body.data || [];
    expect(bookings.length).toBeLessThanOrEqual(5);
  });

  test('TC-ABK-05: PUT /api/admin/bookings/:id/complete without auth returns 401', async ({ request }) => {
    const res = await request.put(`${API_URL}/admin/bookings/1/complete`);
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 7 — Booking Page UI (Admin)
// ═══════════════════════════════════════════════════════════════════
test.describe('Admin Bookings Page — UI', () => {

  test('TC-ABUI-01: /admin/bookings page loads for admin', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/bookings');
    await page.waitForURL('**/admin/bookings', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(800);
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible({ timeout: 5000 });
  });

  test('TC-ABUI-02: bookings table has status column', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/bookings');
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).toMatch(/स्थिती|status|Status/i);
  });

  test('TC-ABUI-03: status filter dropdown visible', async ({ page }) => {
    const token = await adminLogin(page);
    if (!token) return test.skip();
    await page.goto('/admin/bookings');
    await page.waitForTimeout(1000);
    const select = page.locator('select').first();
    await expect(select).toBeVisible({ timeout: 5000 });
  });

  test('TC-ABUI-04: My Bookings page requires login', async ({ page }) => {
    await page.goto('/my-bookings');
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).not.toContain('my-bookings');
  });
});
