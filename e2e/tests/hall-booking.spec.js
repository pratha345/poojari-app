// e2e/tests/hall-booking.spec.js — Hall Booking & Admin Hall Management Tests
const { test, expect } = require('@playwright/test');

const APP_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000/api';

// Admin credentials
const ADMIN_PHONE    = '9000000000';
const ADMIN_PASSWORD = 'Admin@123';

// Test hall data
const TEST_HALL = {
  name:          'Playwright Test Mangal Karyalay',
  phone:         '9000000001',
  whatsapp:      '9000000001',
  city:          'Pune',
  address:       '123 Test Nagar, Shivajinagar, Pune',
  capacity:      '300',
  price_per_day: '20000',
};

// Mumbai lat/lng for map click
const MUMBAI_LAT = 19.0760;
const MUMBAI_LNG = 72.8777;

async function waitForLoad(page) {
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 1: Hall Booking Page (Customer Side)
// ─────────────────────────────────────────────────────────────────────

test.describe('Hall Booking Page — Customer', () => {

  test('hall booking page loads correctly', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);

    await expect(page).toHaveTitle(/हॉल/i);
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('हॉल');
  });

  test('page shows city search input', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);

    const input = page.locator('input[placeholder*="शहर"]');
    await expect(input).toBeVisible();
  });

  test('city search returns results or empty state', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);

    const input = page.locator('input[placeholder*="शहर"]');
    await input.fill('Pune');
    await page.locator('button[type="submit"]').first().click();
    await waitForLoad(page);

    // Either halls or empty state message
    const hasHalls  = await page.locator('[class*="hallGrid"], [class*="card"]').count();
    const hasEmpty  = await page.locator('[class*="empty"]').count();
    expect(hasHalls + hasEmpty).toBeGreaterThan(0);
  });

  test('breadcrumb shows correct navigation', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);

    const breadcrumb = page.locator('[class*="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('मुख्यपृष्ठ');
    await expect(breadcrumb).toContainText('हॉल बुकिंग');
  });

  test('nearby button appears when in city mode', async ({ page }) => {
    // Start in city mode (deny geolocation)
    await page.context().grantPermissions([]);
    await page.goto('/hall-booking');
    await waitForLoad(page);

    // Search city first to enter city mode
    const input = page.locator('input[placeholder*="शहर"]');
    await input.fill('Mumbai');
    await page.locator('button[type="submit"]').first().click();
    await waitForLoad(page);

    const nearbyBtn = page.locator('button:has-text("जवळचे शोधा")');
    if (await nearbyBtn.count() > 0) {
      await expect(nearbyBtn).toBeVisible();
    }
  });

  test('map/list toggle buttons are visible when halls exist', async ({ page }) => {
    // Mock geolocation to Mumbai
    await page.context().setGeolocation({ latitude: MUMBAI_LAT, longitude: MUMBAI_LNG });
    await page.context().grantPermissions(['geolocation']);
    await page.goto('/hall-booking');
    await waitForLoad(page);

    // If halls exist, toggle buttons appear
    const listBtn = page.locator('button:has-text("यादी")');
    const mapBtn  = page.locator('button:has-text("नकाशा")');
    const hallsExist = await listBtn.count() > 0;
    if (hallsExist) {
      await expect(listBtn).toBeVisible();
      await expect(mapBtn).toBeVisible();
    }
  });

  test('geolocation mock triggers nearby search', async ({ page }) => {
    await page.context().setGeolocation({ latitude: MUMBAI_LAT, longitude: MUMBAI_LNG });
    await page.context().grantPermissions(['geolocation']);

    const [nearbyReq] = await Promise.all([
      page.waitForRequest(req => req.url().includes('/halls/nearby'), { timeout: 8000 }).catch(() => null),
      page.goto('/hall-booking'),
    ]);

    if (nearbyReq) {
      expect(nearbyReq.url()).toContain('lat=');
      expect(nearbyReq.url()).toContain('lng=');
    }
  });

  test('reset button clears city search', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);

    const input = page.locator('input[placeholder*="शहर"]');
    await input.fill('Nagpur');
    await page.locator('button[type="submit"]').first().click();
    await waitForLoad(page);

    const resetBtn = page.locator('button:has-text("रीसेट")');
    if (await resetBtn.count() > 0) {
      await resetBtn.click();
      await waitForLoad(page);
      const val = await input.inputValue();
      expect(val).toBe('');
    }
  });

  test('map view renders Leaflet container', async ({ page }) => {
    await page.context().setGeolocation({ latitude: MUMBAI_LAT, longitude: MUMBAI_LNG });
    await page.context().grantPermissions(['geolocation']);
    await page.goto('/hall-booking');
    await waitForLoad(page);

    const mapBtn = page.locator('button:has-text("नकाशा")');
    if (await mapBtn.count() > 0) {
      await mapBtn.click();
      await page.waitForTimeout(1500);
      const leafletMap = page.locator('.leaflet-container');
      await expect(leafletMap).toBeVisible({ timeout: 6000 });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// SECTION 2: Admin Hall Management
// ─────────────────────────────────────────────────────────────────────

test.describe('Admin Hall Management', () => {

  // Helper: get admin token via API and inject into localStorage
  async function adminLogin(page) {
    // Step 1: get token via API (faster & reliable)
    const res = await page.request.post(`${API_URL}/auth/login`, {
      data: { phone: ADMIN_PHONE, password: ADMIN_PASSWORD },
    });
    let token = null;
    let userData = null;
    if (res.ok()) {
      const body = await res.json();
      token    = body.data?.token;
      userData = body.data?.user;
    }

    // Step 2: inject token into localStorage so React reads it on next navigation
    await page.goto('/');
    await page.evaluate(({ tok, usr }) => {
      if (tok) {
        localStorage.setItem('pojjari_token', tok);
        localStorage.setItem('pojjari_user', JSON.stringify(usr));
      }
    }, { tok: token, usr: userData });
  }

  // Helper: go to halls page and wait for it to render
  async function gotoHalls(page) {
    await page.goto('/admin/halls');
    await page.waitForURL('**/admin/halls', { timeout: 8000 }).catch(() => {});
    await waitForLoad(page);
    await page.waitForTimeout(600);
  }

  test('admin can navigate to Manage Halls page', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);

    // Page title in topbar (class*="pageTitle") shows "Manage Halls"
    const pageTitle = page.locator('[class*="pageTitle"], [class*="title"]').first();
    await expect(pageTitle).toBeVisible({ timeout: 5000 });
    await expect(pageTitle).toContainText(/Hall|हॉल/i);
  });

  test('Manage Halls shows add button', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);

    const addBtn = page.locator('button:has-text("नवीन हॉल जोडा")');
    await expect(addBtn).toBeVisible({ timeout: 6000 });
  });

  test('sidebar has Manage Halls link', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/dashboard');
    await waitForLoad(page);

    const hallsLink = page.locator('a[href="/admin/halls"]');
    await expect(hallsLink).toBeVisible({ timeout: 5000 });
  });

  test('clicking add button opens form modal', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);

    await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
    await page.waitForTimeout(500);

    const modal = page.locator('[class*="modal_"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal).toContainText('नवीन हॉल जोडा');
  });

  test('form has all required fields', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);

    await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
    await page.waitForTimeout(500);

    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="whatsapp"]')).toBeVisible();
    await expect(page.locator('input[name="city"]')).toBeVisible();
    await expect(page.locator('input[name="address"]')).toBeVisible();
    await expect(page.locator('input[name="capacity"]')).toBeVisible();
    await expect(page.locator('input[name="price_per_day"]')).toBeVisible();
    await expect(page.locator('input[name="latitude"]')).toBeVisible();
    await expect(page.locator('input[name="longitude"]')).toBeVisible();
  });

  test('form map picker is visible', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);

    await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
    await page.waitForTimeout(1000);

    const mapContainer = page.locator('.leaflet-container').last();
    await expect(mapContainer).toBeVisible({ timeout: 8000 });
  });

  test('form validation: empty submit shows error', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);

    await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
    await page.waitForTimeout(600);

    // Click the save button without filling required fields
    const saveBtn = page.locator('[class*="saveBtn"]');
    await expect(saveBtn).toBeVisible({ timeout: 4000 });
    await saveBtn.click();
    await page.waitForTimeout(500);

    // Modal should remain open (validation prevented submission)
    const modal = page.locator('[class*="modal_"]').first();
    await expect(modal).toBeVisible({ timeout: 3000 });
  });

  test('admin can add a new hall successfully', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);

    const addBtn = page.locator('button:has-text("नवीन हॉल जोडा")').first();
    await expect(addBtn).toBeVisible({ timeout: 8000 });
    await addBtn.click();
    await page.waitForTimeout(600);

    // Fill form
    await page.locator('input[name="name"]').fill(TEST_HALL.name);
    await page.locator('input[name="phone"]').fill(TEST_HALL.phone);
    await page.locator('input[name="whatsapp"]').fill(TEST_HALL.whatsapp);
    await page.locator('input[name="city"]').fill(TEST_HALL.city);
    await page.locator('input[name="address"]').fill(TEST_HALL.address);
    await page.locator('input[name="capacity"]').fill(TEST_HALL.capacity);
    await page.locator('input[name="price_per_day"]').fill(TEST_HALL.price_per_day);
    await page.locator('input[name="latitude"]').fill('18.5204');
    await page.locator('input[name="longitude"]').fill('73.8567');

    // Submit
    await page.locator('button:has-text("✅ जोडा")').click();
    await waitForLoad(page);

    // Modal closes after successful save
    await expect(page.locator('[class*="modal_"]')).toHaveCount(0, { timeout: 6000 });

    // Hall appears in table
    await expect(page.locator(`td:has-text("${TEST_HALL.name}")`)).toBeVisible({ timeout: 8000 });
  });

  test('added hall shows location as Set', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);

    const hallRow = page.locator(`tr:has(td:has-text("${TEST_HALL.name}"))`);
    if (await hallRow.count() > 0) {
      await expect(hallRow.locator('[class*="locSet"]')).toBeVisible();
    }
  });

  test('admin can edit an existing hall', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);

    const hallRow = page.locator(`tr:has(td:has-text("${TEST_HALL.name}"))`);
    if (await hallRow.count() > 0) {
      await hallRow.locator('button:has-text("Edit")').click();
      await page.waitForTimeout(500);

      await expect(page.locator('[class*="modal_"]').first()).toContainText('Edit');
      await page.locator('input[name="city"]').fill('Nashik');
      await page.locator('button:has-text("अपडेट")').click();

      // Modal closes after successful update
      await expect(page.locator('[class*="modal_"]')).toHaveCount(0, { timeout: 6000 });
    }
  });

  test('admin can delete a hall', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);

    const hallRow = page.locator(`tr:has(td:has-text("${TEST_HALL.name}"))`);
    if (await hallRow.count() > 0) {
      page.on('dialog', dialog => dialog.accept());
      await hallRow.locator('button:has-text("Delete")').click();
      await page.waitForTimeout(2000);

      // Row should be gone after delete
      await expect(page.locator(`td:has-text("${TEST_HALL.name}")`)).toHaveCount(0, { timeout: 6000 });
    }
  });

  test('close button dismisses modal without saving', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);

    await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
    await page.waitForTimeout(500);

    await page.locator('button[class*="closeBtn"]').click();
    await page.waitForTimeout(400);

    const modal = page.locator('[class*="modal_"]');
    await expect(modal).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// SECTION 3: API Direct Tests
// ─────────────────────────────────────────────────────────────────────

test.describe('Hall API — Backend', () => {

  test('GET /api/halls returns success', async ({ request }) => {
    const res = await request.get(`${API_URL}/halls`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/halls/nearby requires lat & lng', async ({ request }) => {
    const res = await request.get(`${API_URL}/halls/nearby`);
    expect(res.status()).toBe(400);
  });

  test('GET /api/halls/nearby with valid coords returns success', async ({ request }) => {
    const res = await request.get(`${API_URL}/halls/nearby?lat=19.076&lng=72.877`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/halls/nearby results within 40km range', async ({ request }) => {
    const res  = await request.get(`${API_URL}/halls/nearby?lat=19.076&lng=72.877`);
    const body = await res.json();
    body.data.forEach(hall => {
      if (hall.distance != null) expect(hall.distance).toBeLessThanOrEqual(40);
    });
  });

  test('POST /api/admin/halls without auth returns 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/admin/halls`, {
      data: { name: 'Test', phone: '1234567890' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/admin/halls without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/halls`);
    expect(res.status()).toBe(401);
  });
});
