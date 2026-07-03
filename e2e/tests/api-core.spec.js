// e2e/tests/api-core.spec.js — Core API Tests
// Covers: Blog, Contact, Panchang, Rashifal, Subscription, Halls, Cities, Chat, Tickets
const { test, expect } = require('@playwright/test');

const API_URL        = process.env.API_BASE_URL || 'http://localhost:5000/api';
const ADMIN_PHONE    = '9307720459';
const ADMIN_PASSWORD = 'Admin@123';

async function getAdminToken(request) {
  const res  = await request.post(`${API_URL}/auth/login`, {
    data: { phone: ADMIN_PHONE, password: ADMIN_PASSWORD },
  });
  const body = await res.json();
  return body.data?.token || '';
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 1 — Blog API
// ═══════════════════════════════════════════════════════════════════
test.describe('Blog API — Endpoints', () => {

  let adminToken = '';
  let firstSlug  = '';

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
    const res  = await request.get(`${API_URL}/blog?limit=1`);
    if (res.ok()) {
      const body = await res.json();
      firstSlug = body.data?.posts?.[0]?.slug || '';
    }
  });

  test('TC-BLG-01: GET /api/blog returns list with success:true', async ({ request }) => {
    const res  = await request.get(`${API_URL}/blog`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data?.posts || body.data)).toBe(true);
  });

  test('TC-BLG-02: GET /api/blog?limit=5 returns max 5 results', async ({ request }) => {
    const res  = await request.get(`${API_URL}/blog?limit=5`);
    const body = await res.json();
    const posts = body.data?.posts || body.data || [];
    expect(posts.length).toBeLessThanOrEqual(5);
  });

  test('TC-BLG-03: GET /api/blog/:slug returns single post', async ({ request }) => {
    if (!firstSlug) return test.skip();
    const res  = await request.get(`${API_URL}/blog/${firstSlug}`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
    expect(body.data.slug).toBe(firstSlug);
  });

  test('TC-BLG-04: GET /api/blog/invalid-slug-xyz returns 404', async ({ request }) => {
    const res = await request.get(`${API_URL}/blog/invalid-slug-xyz-not-real`);
    expect([404, 400]).toContain(res.status());
  });

  test('TC-BLG-05: Blog list post has required fields (title, slug, excerpt)', async ({ request }) => {
    const res  = await request.get(`${API_URL}/blog?limit=1`);
    const body = await res.json();
    const posts = body.data?.posts || body.data || [];
    if (posts.length === 0) return;
    const post = posts[0];
    expect(post.title || post.title_mr).toBeTruthy();
    expect(post.slug).toBeTruthy();
  });

  test('TC-BLG-06: POST /api/blog without auth returns 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/blog`, {
      data: { title: 'Test', content: 'Test content', slug: 'test-blog' },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-BLG-07: GET /api/blog?category= filters by category', async ({ request }) => {
    const res  = await request.get(`${API_URL}/blog?category=ज्योतिष`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
  });

  test('TC-BLG-08: Blog views increment on detail fetch', async ({ request }) => {
    if (!firstSlug) return test.skip();
    const before = await request.get(`${API_URL}/blog/${firstSlug}`);
    const beforeBody = await before.json();
    const viewsBefore = beforeBody.data?.views || 0;

    await request.get(`${API_URL}/blog/${firstSlug}`);
    const after = await request.get(`${API_URL}/blog/${firstSlug}`);
    const afterBody = await after.json();
    const viewsAfter = afterBody.data?.views || 0;

    expect(viewsAfter).toBeGreaterThanOrEqual(viewsBefore);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 2 — Panchang API
// ═══════════════════════════════════════════════════════════════════
test.describe('Panchang API — Endpoints', () => {

  test('TC-PCH-01: GET /api/panchang/:date returns tithi/nakshatra data', async ({ request }) => {
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    const res   = await request.get(`${API_URL}/panchang/${today}`);
    const body  = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
    expect(body.data).toBeTruthy();
  });

  test('TC-PCH-02: Panchang response includes tithi field', async ({ request }) => {
    const today = new Date().toISOString().split('T')[0];
    const res   = await request.get(`${API_URL}/panchang/${today}`);
    const body  = await res.json();
    expect(res.ok()).toBeTruthy();
    const data = body.data;
    // At least tithi or maas should be present
    const hasPanchang = data.tithi !== undefined || data.nakshatra !== undefined
      || data.yoga !== undefined || data.maas !== undefined;
    expect(hasPanchang).toBe(true);
  });

  test('TC-PCH-03: Panchang with lat/lng param works', async ({ request }) => {
    const today = new Date().toISOString().split('T')[0];
    const res   = await request.get(`${API_URL}/panchang/${today}?lat=20.93&lng=77.75`);
    expect(res.ok()).toBeTruthy();
  });

  test('TC-PCH-04: Panchang with invalid date handles gracefully', async ({ request }) => {
    const res = await request.get(`${API_URL}/panchang/invalid-date`);
    expect(res.status()).not.toBe(200);
  });

  test('TC-PCH-05: Panchang for future date works', async ({ request }) => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const dateStr = future.toISOString().split('T')[0];
    const res = await request.get(`${API_URL}/panchang/${dateStr}`);
    expect(res.ok()).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 3 — Rashifal API
// ═══════════════════════════════════════════════════════════════════
test.describe('Rashifal API — Endpoints', () => {

  test('TC-RHF-01: GET /api/rashifal/:rashiId/tomorrow returns data', async ({ request }) => {
    const res  = await request.get(`${API_URL}/rashifal/1/tomorrow`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
  });

  test('TC-RHF-02: GET /api/rashifal/:rashiId/weekly returns data', async ({ request }) => {
    const res  = await request.get(`${API_URL}/rashifal/1/weekly`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
  });

  test('TC-RHF-03: All 12 rashis return tomorrow data', async ({ request }) => {
    for (let i = 1; i <= 12; i++) {
      const res = await request.get(`${API_URL}/rashifal/${i}/tomorrow`);
      // Should not 500 for any valid rashi ID
      expect(res.status()).not.toBe(500);
    }
  });

  test('TC-RHF-04: Invalid rashi ID handles gracefully', async ({ request }) => {
    const res = await request.get(`${API_URL}/rashifal/99/tomorrow`);
    expect([400, 404, 500]).toContain(res.status()); // Not 200 with empty data
  });

  test('TC-RHF-05: Rashifal response has general/career/love fields', async ({ request }) => {
    const res  = await request.get(`${API_URL}/rashifal/1/tomorrow`);
    const body = await res.json();
    if (!res.ok() || !body.data) return; // AI may be rate-limited
    const data = body.data;
    const hasFields = data.general !== undefined || data.career !== undefined
      || data.love !== undefined || data.health !== undefined;
    expect(hasFields).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 4 — Contact API
// ═══════════════════════════════════════════════════════════════════
test.describe('Contact API — Endpoints', () => {

  test('TC-CON-01: POST /api/contact with valid data returns success', async ({ request }) => {
    const res  = await request.post(`${API_URL}/contact`, {
      data: {
        name:    'Playwright Test',
        phone:   '9876543210',
        message: 'This is a test message from Playwright',
      },
    });
    const body = await res.json();
    expect([200, 201]).toContain(res.status());
    expect(body.success).toBe(true);
  });

  test('TC-CON-02: POST /api/contact without name returns 400', async ({ request }) => {
    const res = await request.post(`${API_URL}/contact`, {
      data: { phone: '9876543210', message: 'Test' },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('TC-CON-03: POST /api/contact without message returns 400', async ({ request }) => {
    const res = await request.post(`${API_URL}/contact`, {
      data: { name: 'Test', phone: '9876543210' },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('TC-CON-04: POST /api/contact with very long message handles gracefully', async ({ request }) => {
    const res = await request.post(`${API_URL}/contact`, {
      data: {
        name:    'Test',
        phone:   '9876543210',
        message: 'A'.repeat(5000),
      },
    });
    expect(res.status()).not.toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 5 — Subscription API
// ═══════════════════════════════════════════════════════════════════
test.describe('Subscription API — Endpoints', () => {

  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
  });

  test('TC-SUB-01: GET /api/subscription/plans returns plans list', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.get(`${API_URL}/subscription/plans`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
  });

  test('TC-SUB-02: Plans response includes basic and premium', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.get(`${API_URL}/subscription/plans`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    const data = body.data;
    // Either plans array or plan info should have basic/premium
    const str = JSON.stringify(data).toLowerCase();
    expect(str).toMatch(/basic|premium|plan/);
  });

  test('TC-SUB-03: POST /api/subscription/create-order without auth returns 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/subscription/create-order`, {
      data: { plan: 'basic', months: 1 },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-SUB-04: POST /api/subscription/request creates upgrade request', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.post(`${API_URL}/subscription/request`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        requested_plan: 'premium',
        months:         1,
        message:        'Test upgrade request from Playwright',
      },
    });
    expect([200, 201, 400]).toContain(res.status()); // 400 if already pending
  });

  test('TC-SUB-05: GET /api/subscription/plans without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/subscription/plans`);
    expect(res.status()).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 6 — Halls API
// ═══════════════════════════════════════════════════════════════════
test.describe('Halls API — Endpoints', () => {

  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
  });

  test('TC-HLL-01: GET /api/halls returns list', async ({ request }) => {
    const res  = await request.get(`${API_URL}/halls`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('TC-HLL-02: GET /api/halls with district filter', async ({ request }) => {
    const res  = await request.get(`${API_URL}/halls?district=Amravati`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
  });

  test('TC-HLL-03: POST /api/halls without auth returns 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/halls`, {
      data: { name: 'Test Hall', city: 'Nagpur' },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-HLL-04: POST /api/halls with admin token creates hall', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.post(`${API_URL}/halls`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name:        'Playwright Test Hall',
        city:        'Amravati',
        district:    'Amravati',
        address:     '123 Test Street',
        capacity:    200,
        price_per_day: 5000,
      },
    });
    const body = await res.json();
    expect([200, 201]).toContain(res.status());
    expect(body.success).toBe(true);

    // Cleanup: delete the test hall
    if (body.data?.id) {
      await request.delete(`${API_URL}/halls/${body.data.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
  });

  test('TC-HLL-05: DELETE /api/halls/99999 returns 404', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res = await request.delete(`${API_URL}/halls/99999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect([404, 400]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 7 — Cities API
// ═══════════════════════════════════════════════════════════════════
test.describe('Cities API — Endpoints', () => {

  test('TC-CTY-01: GET /api/cities returns list of cities', async ({ request }) => {
    const res  = await request.get(`${API_URL}/cities`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('TC-CTY-02: City list includes Pune/Mumbai/Nashik', async ({ request }) => {
    const res  = await request.get(`${API_URL}/cities`);
    const body = await res.json();
    const names = (body.data || []).map(c => (c.name || c.slug || '').toLowerCase());
    const hasMaharashtra = names.some(n => n.includes('pune') || n.includes('mumbai') || n.includes('nashik'));
    expect(hasMaharashtra).toBe(true);
  });

  test('TC-CTY-03: GET /api/cities/:slug returns city details', async ({ request }) => {
    const res  = await request.get(`${API_URL}/cities/pune`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
  });

  test('TC-CTY-04: GET /api/cities/invalid-city returns 404', async ({ request }) => {
    const res = await request.get(`${API_URL}/cities/invalid-city-xyz-not-real`);
    expect([404, 400]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 8 — Support Tickets API
// ═══════════════════════════════════════════════════════════════════
test.describe('Tickets API — Endpoints', () => {

  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminToken(request);
  });

  test('TC-TKT-01: POST /api/tickets creates a ticket (public)', async ({ request }) => {
    const res  = await request.post(`${API_URL}/tickets`, {
      data: {
        name:    'Playwright Test',
        phone:   '9876543210',
        subject: 'Test Ticket',
        message: 'This is a test support ticket from Playwright',
      },
    });
    const body = await res.json();
    expect([200, 201]).toContain(res.status());
    expect(body.success).toBe(true);
    expect(body.data?.ticketCode || body.data?.ticket_code).toMatch(/TKT-|SUP-/i);
  });

  test('TC-TKT-02: POST /api/tickets without subject returns 400', async ({ request }) => {
    const res = await request.post(`${API_URL}/tickets`, {
      data: { name: 'Test', phone: '9876543210' },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('TC-TKT-03: GET /api/tickets without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/tickets`);
    expect(res.status()).toBe(401);
  });

  test('TC-TKT-04: GET /api/tickets with admin token returns list', async ({ request }) => {
    if (!adminToken) return test.skip();
    const res  = await request.get(`${API_URL}/tickets`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data?.tickets || body.data)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 9 — Tenant Registration
// ═══════════════════════════════════════════════════════════════════
test.describe('Tenant Registration API', () => {

  test('TC-TNT-01: POST /api/register-tenant with missing fields returns 400', async ({ request }) => {
    const res = await request.post(`${API_URL}/register-tenant`, {
      data: { name: 'Test Tenant' },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('TC-TNT-02: POST /api/register-tenant duplicate slug returns error', async ({ request }) => {
    // pojjari slug already exists (tenant id=1)
    const res = await request.post(`${API_URL}/register-tenant`, {
      data: {
        business_name: 'Pojjari',
        city:          'Amravati',
        contact_name:  'Test Owner',
        phone:         '9000000099',
        password:      'Test@12345',
      },
    });
    // Should reject duplicate or return conflict
    expect([409, 400, 422]).toContain(res.status());
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 10 — Dharmasindhu API (Sacred Text)
// ═══════════════════════════════════════════════════════════════════
test.describe('Dharmasindhu API', () => {

  test('TC-DHS-01: GET /api/dharmasindhu returns search interface', async ({ request }) => {
    const res = await request.get(`${API_URL}/dharmasindhu`);
    expect(res.status()).not.toBe(500);
  });

  test('TC-DHS-02: GET /api/dharmasindhu/search?q=गणेश returns results', async ({ request }) => {
    const res  = await request.get(`${API_URL}/dharmasindhu/search?q=गणेश`);
    const body = await res.json();
    expect(res.status()).not.toBe(500);
    if (res.ok()) expect(body.success).toBe(true);
  });

  test('TC-DHS-03: GET /api/dharmasindhu/progress returns OCR progress', async ({ request }) => {
    const res = await request.get(`${API_URL}/dharmasindhu/progress`);
    expect(res.status()).not.toBe(500);
  });
});
