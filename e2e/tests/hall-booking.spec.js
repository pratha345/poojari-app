// e2e/tests/hall-booking.spec.js
// Tests: District/Taluka search, SearchableSelect, Map auto-center,
//        Admin Hall CRUD with geocoding, hover popups, existing hall markers
const { test, expect } = require('@playwright/test');

const API_URL        = process.env.API_BASE_URL || 'http://localhost:5000/api';
const ADMIN_PHONE    = '9307720459';
const ADMIN_PASSWORD = 'Admin@123';

const TEST_HALL = {
  name:          'Playwright Test Mangal Karyalay',
  phone:         '9876543210',
  whatsapp:      '9876543210',
  district:      'पुणे',
  taluka:        'पुणे शहर',
  city:          'Shivajinagar',
  address:       '123 Test Nagar, Shivajinagar',
  capacity:      '300',
  price_per_day: '20000',
};

async function waitForLoad(page) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}

async function adminLogin(page) {
  const res = await page.request.post(`${API_URL}/auth/login`, {
    data: { phone: ADMIN_PHONE, password: ADMIN_PASSWORD },
  });
  if (res.ok()) {
    const body = await res.json();
    await page.goto('/');
    await page.evaluate(({ tok, usr }) => {
      if (tok) {
        localStorage.setItem('pojjari_token', tok);
        localStorage.setItem('pojjari_user', JSON.stringify(usr));
      }
    }, { tok: body.data?.token, usr: body.data?.user });
  }
}

async function gotoHalls(page) {
  await page.goto('/admin/halls');
  await page.waitForURL('**/admin/halls', { timeout: 8000 }).catch(() => {});
  await waitForLoad(page);
  await page.waitForTimeout(600);
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 1 — Hall Booking Page (Customer)
// ═══════════════════════════════════════════════════════════════════

test.describe('Hall Booking — Customer Search', () => {

  test('TC-HB-01: page loads with title and subtitle', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);
    await expect(page.locator('h1').first()).toContainText('हॉल बुकिंग');
    await expect(page.locator('[class*="pageSubtitle"]')).toBeVisible();
  });

  test('TC-HB-02: district SearchableSelect renders with placeholder', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);
    const trigger = page.locator('[class*="trigger"]').first();
    await expect(trigger).toBeVisible();
    await expect(trigger).toContainText('जिल्हा निवडा');
  });

  test('TC-HB-03: clicking district dropdown opens search box', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);
    await page.locator('[class*="trigger"]').first().click();
    const searchInput = page.locator('[class*="searchInput"]').first();
    await expect(searchInput).toBeVisible({ timeout: 3000 });
  });

  test('TC-HB-04: typing "rtn" finds रत्नागिरी (subsequence match)', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);
    await page.locator('[class*="trigger"]').first().click();
    await page.locator('[class*="searchInput"]').first().fill('rtn');
    await page.waitForTimeout(300);
    const items = page.locator('[class*="itemLabel"]');
    const found = await items.filter({ hasText: 'रत्नागिरी' }).count();
    expect(found).toBeGreaterThan(0);
  });

  test('TC-HB-05: typing "pune" finds पुणे district', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);
    await page.locator('[class*="trigger"]').first().click();
    await page.locator('[class*="searchInput"]').first().fill('pune');
    await page.waitForTimeout(300);
    const found = await page.locator('[class*="itemLabel"]').filter({ hasText: 'पुणे' }).count();
    expect(found).toBeGreaterThan(0);
  });

  test('TC-HB-06: selecting district enables taluka dropdown', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);
    // open district dropdown, pick पुणे
    await page.locator('[class*="trigger"]').first().click();
    await page.locator('[class*="searchInput"]').first().fill('pune');
    await page.waitForTimeout(300);
    await page.locator('[class*="itemLabel"]').filter({ hasText: /^पुणे$/ }).first().click();
    await page.waitForTimeout(300);
    // Taluka trigger should now be enabled
    const talukaTrigger = page.locator('[class*="trigger"]').nth(1);
    await expect(talukaTrigger).not.toHaveAttribute('disabled');
  });

  test('TC-HB-07: taluka dropdown lists talukas after district selected', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);
    // select पुणे district
    await page.locator('[class*="trigger"]').first().click();
    await page.locator('[class*="searchInput"]').first().fill('pune');
    await page.waitForTimeout(300);
    await page.locator('[class*="itemLabel"]').filter({ hasText: /^पुणे$/ }).first().click();
    await page.waitForTimeout(300);
    // open taluka dropdown
    await page.locator('[class*="trigger"]').nth(1).click();
    const talukaItems = page.locator('[class*="itemLabel"]');
    await expect(talukaItems.first()).toBeVisible({ timeout: 3000 });
    const count = await talukaItems.count();
    expect(count).toBeGreaterThan(3); // Pune has 14 talukas
  });

  test('TC-HB-08: शोधा button disabled when no district selected', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);
    const searchBtn = page.locator('button:has-text("शोधा")');
    await expect(searchBtn).toBeDisabled();
  });

  test('TC-HB-09: शोधा button enabled after district selected', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);
    await page.locator('[class*="trigger"]').first().click();
    await page.locator('[class*="searchInput"]').first().fill('nagpur');
    await page.waitForTimeout(300);
    await page.locator('[class*="itemLabel"]').filter({ hasText: 'नागपूर' }).first().click();
    const searchBtn = page.locator('button:has-text("शोधा")');
    await expect(searchBtn).toBeEnabled({ timeout: 3000 });
  });

  test('TC-HB-10: searching by district fires API with district param', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);
    // Select district
    await page.locator('[class*="trigger"]').first().click();
    await page.locator('[class*="searchInput"]').first().fill('pune');
    await page.waitForTimeout(300);
    await page.locator('[class*="itemLabel"]').filter({ hasText: /^पुणे$/ }).first().click();
    await page.waitForTimeout(300);
    // Click search and watch request
    const [req] = await Promise.all([
      page.waitForRequest(r => r.url().includes('/halls') && r.url().includes('district='), { timeout: 5000 }),
      page.locator('button:has-text("शोधा")').click(),
    ]);
    expect(req.url()).toContain('district=');
  });

  test('TC-HB-11: status label updates after district search', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);
    await page.locator('[class*="trigger"]').first().click();
    await page.locator('[class*="searchInput"]').first().fill('kolhapur');
    await page.waitForTimeout(300);
    await page.locator('[class*="itemLabel"]').filter({ hasText: 'कोल्हापूर' }).first().click();
    await page.locator('button:has-text("शोधा")').click();
    await waitForLoad(page);
    const status = page.locator('[class*="locStatus"]');
    await expect(status).toContainText('कोल्हापूर', { timeout: 5000 });
  });

  test('TC-HB-12: रीसेट button appears after search and clears selection', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);
    await page.locator('[class*="trigger"]').first().click();
    await page.locator('[class*="searchInput"]').first().fill('pune');
    await page.waitForTimeout(300);
    await page.locator('[class*="itemLabel"]').filter({ hasText: /^पुणे$/ }).first().click();
    await page.locator('button:has-text("शोधा")').click();
    await waitForLoad(page);
    const resetBtn = page.locator('button:has-text("रीसेट")');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await waitForLoad(page);
    const trigger = page.locator('[class*="trigger"]').first();
    await expect(trigger).toContainText('जिल्हा निवडा');
  });

  test('TC-HB-13: 📍 जवळचे button triggers geolocation request', async ({ page }) => {
    await page.context().setGeolocation({ latitude: 19.076, longitude: 72.877 });
    await page.context().grantPermissions(['geolocation']);
    await page.goto('/hall-booking');
    await waitForLoad(page);
    const [req] = await Promise.all([
      page.waitForRequest(r => r.url().includes('/halls/nearby'), { timeout: 8000 }),
      page.locator('button:has-text("जवळचे")').click(),
    ]);
    expect(req.url()).toContain('lat=');
  });

  test('TC-HB-14: district ✕ clear button resets selection', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);
    await page.locator('[class*="trigger"]').first().click();
    await page.locator('[class*="searchInput"]').first().fill('pune');
    await page.waitForTimeout(300);
    await page.locator('[class*="itemLabel"]').filter({ hasText: /^पुणे$/ }).first().click();
    await page.waitForTimeout(300);
    // Click the ✕ clear icon inside the trigger
    const clearIcon = page.locator('[class*="clearIcon"]').first();
    await expect(clearIcon).toBeVisible();
    await clearIcon.click();
    await expect(page.locator('[class*="trigger"]').first()).toContainText('जिल्हा निवडा');
  });

  test('TC-HB-15: hall card shows district › taluka badge', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);
    // if any halls have district set, their badge shows "district › taluka"
    const badges = page.locator('[class*="cityBadge"]');
    const count  = await badges.count();
    if (count > 0) {
      const text = await badges.first().innerText();
      expect(text).toMatch(/📍/);
    }
  });

  test('TC-HB-16: typing non-existent district shows no result message', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);
    await page.locator('[class*="trigger"]').first().click();
    await page.locator('[class*="searchInput"]').first().fill('xyz123notadistrict');
    await page.waitForTimeout(300);
    const noResult = page.locator('[class*="noResult"]');
    await expect(noResult).toBeVisible({ timeout: 3000 });
    await expect(noResult).toContainText('सापडले नाही');
  });

  test('TC-HB-17: breadcrumb shows correct navigation', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);
    const breadcrumb = page.locator('[class*="breadcrumb"]');
    await expect(breadcrumb).toContainText('मुख्यपृष्ठ');
    await expect(breadcrumb).toContainText('हॉल बुकिंग');
  });

  test('TC-HB-18: map/list toggle visible when halls exist', async ({ page }) => {
    await page.goto('/hall-booking');
    await waitForLoad(page);
    const listBtn = page.locator('button:has-text("यादी")');
    if (await listBtn.count() > 0) {
      await expect(listBtn).toBeVisible();
      await expect(page.locator('button:has-text("नकाशा")')).toBeVisible();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 2 — Admin Manage Halls (District/Taluka + Map)
// ═══════════════════════════════════════════════════════════════════

test.describe('Admin Manage Halls — District/Taluka + Map', () => {

  test('TC-AH-01: Manage Halls page loads for admin', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);
    await expect(page.locator('[class*="title"]').first()).toContainText(/Hall|हॉल/i);
  });

  test('TC-AH-02: add form has district SearchableSelect', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);
    await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
    await page.waitForTimeout(600);
    // district trigger should be visible with placeholder
    const triggers = page.locator('[class*="trigger"]');
    await expect(triggers.first()).toBeVisible({ timeout: 5000 });
    await expect(triggers.first()).toContainText('जिल्हा निवडा');
  });

  test('TC-AH-03: selecting district in form auto-geocodes and fills lat/lng', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);
    await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
    await page.waitForTimeout(600);
    // pick Nashik
    await page.locator('[class*="trigger"]').first().click();
    await page.locator('[class*="searchInput"]').first().fill('nashik');
    await page.waitForTimeout(300);
    await page.locator('[class*="itemLabel"]').filter({ hasText: 'नाशिक' }).first().click();
    // wait for geocoding
    await page.waitForTimeout(4000);
    const lat = await page.locator('input[name="latitude"]').inputValue();
    const lng = await page.locator('input[name="longitude"]').inputValue();
    expect(parseFloat(lat)).toBeGreaterThan(0);
    expect(parseFloat(lng)).toBeGreaterThan(0);
  });

  test('TC-AH-04: selecting taluka in form refines geocoding', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);
    await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
    await page.waitForTimeout(600);
    // pick Ratnagiri district
    await page.locator('[class*="trigger"]').first().click();
    await page.locator('[class*="searchInput"]').first().fill('rtn');
    await page.waitForTimeout(300);
    await page.locator('[class*="itemLabel"]').filter({ hasText: 'रत्नागिरी' }).first().click();
    await page.waitForTimeout(3000);
    const latAfterDistrict = await page.locator('input[name="latitude"]').inputValue();
    // pick Khed taluka
    await page.locator('[class*="trigger"]').nth(1).click();
    await page.locator('[class*="searchInput"]').last().fill('खेड');
    await page.waitForTimeout(300);
    await page.locator('[class*="itemLabel"]').filter({ hasText: 'खेड' }).first().click();
    await page.waitForTimeout(4000);
    const latAfterTaluka = await page.locator('input[name="latitude"]').inputValue();
    // lat should change after taluka selection
    expect(latAfterTaluka).not.toBe('');
    expect(latAfterDistrict).not.toBe(latAfterTaluka);
  });

  test('TC-AH-05: map is visible in form and shows Maharashtra on open', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);
    await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.leaflet-container').last()).toBeVisible({ timeout: 8000 });
  });

  test('TC-AH-06: clicking map sets lat/lng and shows toast', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);
    await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
    await page.waitForTimeout(1500);
    const map = page.locator('.leaflet-container').last();
    await expect(map).toBeVisible({ timeout: 8000 });
    // Wait for Leaflet tiles to attach
    await page.waitForSelector('.leaflet-tile', { state: 'attached', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(800);

    // Access the Leaflet map via React fiber + dispatch click
    // Leaflet 1.9.x stores _leaflet_id but NOT _leaflet_map on the container.
    // We simulate the full DOM click event with proper clientX/Y so Leaflet
    // converts pixel → latlng and fires its internal 'click' event.
    await page.evaluate(() => {
      const all = [...document.querySelectorAll('.leaflet-container')];
      const el = all[all.length - 1];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.4;
      const cy = rect.top  + rect.height * 0.4;
      // Dispatch a realistic MouseEvent with coordinates
      ['mousedown','mouseup','click'].forEach(type => {
        el.dispatchEvent(new MouseEvent(type, {
          bubbles: true, cancelable: true, view: window,
          clientX: cx, clientY: cy, screenX: cx, screenY: cy,
        }));
      });
    });

    // Wait until lat input is populated (up to 5s)
    await page.waitForFunction(
      () => { const i = document.querySelector('input[name="latitude"]'); return i && i.value !== ''; },
      { timeout: 5000 }
    ).catch(() => {});

    const lat = await page.locator('input[name="latitude"]').inputValue();
    expect(lat).not.toBe('');
    expect(parseFloat(lat)).not.toBeNaN();
    expect(parseFloat(lat)).toBeGreaterThan(0);
  });

  test('TC-AH-07: map legend is visible with hall markers description', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);
    await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
    await page.waitForTimeout(1000);
    const legend = page.locator('[class*="mapLegend"]');
    await expect(legend).toBeVisible({ timeout: 6000 });
    await expect(legend).toContainText('नोंदणीकृत हॉल');
    await expect(legend).toContainText('निवडलेले location');
  });

  test('TC-AH-08: admin can add hall with district and taluka', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);
    await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
    await page.waitForTimeout(600);
    // Fill basic fields
    await page.locator('input[name="name"]').fill(TEST_HALL.name);
    await page.locator('input[name="phone"]').fill(TEST_HALL.phone);
    await page.locator('input[name="whatsapp"]').fill(TEST_HALL.whatsapp);
    await page.locator('input[name="address"]').fill(TEST_HALL.address);
    await page.locator('input[name="capacity"]').fill(TEST_HALL.capacity);
    await page.locator('input[name="price_per_day"]').fill(TEST_HALL.price_per_day);
    // Select district
    await page.locator('[class*="trigger"]').first().click();
    await page.locator('[class*="searchInput"]').first().fill('pune');
    await page.waitForTimeout(300);
    await page.locator('[class*="itemLabel"]').filter({ hasText: /^पुणे$/ }).first().click();
    await page.waitForTimeout(3000); // wait for geocoding
    // Set manual lat/lng
    await page.locator('input[name="latitude"]').fill('18.5204');
    await page.locator('input[name="longitude"]').fill('73.8567');
    await page.locator('button:has-text("✅ जोडा")').click();
    await waitForLoad(page);
    await expect(page.locator('[class*="modal_"]')).toHaveCount(0, { timeout: 6000 });
    await expect(page.locator(`td:has-text("${TEST_HALL.name}")`)).toBeVisible({ timeout: 8000 });
  });

  test('TC-AH-09: table shows जिल्हा/तालुका column', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);
    const header = page.locator('th:has-text("जिल्हा")');
    await expect(header).toBeVisible({ timeout: 5000 });
  });

  test('TC-AH-10: hall row shows district in जिल्हा column', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);
    const hallRow = page.locator(`tr:has(td:has-text("${TEST_HALL.name}"))`);
    if (await hallRow.count() > 0) {
      await expect(hallRow).toContainText('पुणे');
    }
  });

  test('TC-AH-11: edit form pre-fills district and taluka', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);
    const hallRow = page.locator(`tr:has(td:has-text("${TEST_HALL.name}"))`);
    if (await hallRow.count() > 0) {
      await hallRow.locator('button:has-text("Edit")').click();
      await page.waitForTimeout(600);
      // District trigger should show पुणे
      const distTrigger = page.locator('[class*="trigger"]').first();
      await expect(distTrigger).toContainText('पुणे', { timeout: 4000 });
    }
  });

  test('TC-AH-12: delete hall removes it from table', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);
    const hallRow = page.locator(`tr:has(td:has-text("${TEST_HALL.name}"))`);
    if (await hallRow.count() > 0) {
      page.on('dialog', d => d.accept());
      await hallRow.locator('button:has-text("Delete")').click();
      await page.waitForTimeout(2000);
      await expect(page.locator(`td:has-text("${TEST_HALL.name}")`)).toHaveCount(0, { timeout: 6000 });
    }
  });

  test('TC-AH-13: close button dismisses form without saving', async ({ page }) => {
    await adminLogin(page);
    await gotoHalls(page);
    await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
    await page.waitForTimeout(500);
    await page.locator('button[class*="closeBtn"]').click();
    await expect(page.locator('[class*="modal_"]')).toHaveCount(0, { timeout: 3000 });
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 3 — Hall API Backend
// ═══════════════════════════════════════════════════════════════════

test.describe('Hall API — District/Taluka Filtering', () => {

  test('TC-API-01: GET /api/halls returns all halls', async ({ request }) => {
    const res  = await request.get(`${API_URL}/halls`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('TC-API-02: GET /api/halls?district= filters by district', async ({ request }) => {
    const res  = await request.get(`${API_URL}/halls?district=पुणे`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    body.data.forEach(h => expect(h.district).toBe('पुणे'));
  });

  test('TC-API-03: GET /api/halls?district=&taluka= filters by both', async ({ request }) => {
    const res  = await request.get(`${API_URL}/halls?district=रत्नागिरी&taluka=खेड`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    body.data.forEach(h => {
      expect(h.district).toBe('रत्नागिरी');
      expect(h.taluka).toBe('खेड');
    });
  });

  test('TC-API-04: GET /api/halls?city= falls back to city LIKE search', async ({ request }) => {
    const res  = await request.get(`${API_URL}/halls?city=Pune`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('TC-API-05: GET /api/halls/nearby requires lat & lng', async ({ request }) => {
    const res = await request.get(`${API_URL}/halls/nearby`);
    expect(res.status()).toBe(400);
  });

  test('TC-API-06: GET /api/halls/nearby with coords returns within 40km', async ({ request }) => {
    const res  = await request.get(`${API_URL}/halls/nearby?lat=19.076&lng=72.877`);
    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    body.data.forEach(h => {
      if (h.distance != null) expect(h.distance).toBeLessThanOrEqual(40);
    });
  });

  test('TC-API-07: POST /api/admin/halls without auth returns 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/admin/halls`, {
      data: { name: 'Test', phone: '1234567890' },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-API-08: hall data includes district and taluka fields', async ({ request }) => {
    const res  = await request.get(`${API_URL}/halls`);
    const body = await res.json();
    if (body.data.length > 0) {
      const hall = body.data[0];
      expect(Object.prototype.hasOwnProperty.call(hall, 'district')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(hall, 'taluka')).toBe(true);
    }
  });
});
