// e2e/tests/samagri.spec.js
// Tests: Text Import, OCR tab UI, Bulk Delete, Marathi units,
//        parseImportText auto-unit (नग), preview table edit, bulk create API
const { test, expect } = require('@playwright/test');

const API_URL        = 'http://localhost:5000/api';
const ADMIN_PHONE    = '9307720459';
const ADMIN_PASSWORD = 'Admin@123';

// Sample import text
const SAMPLE_TEXT = `हळद - 100 ग्रॅम
साखर - 250 ग्रॅम
नारळ - 2 नग
सुपारी - 10 नग
तूप - 100 ग्रॅम
फुलांचा हार`;

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

async function gotoSamagri(page) {
  await page.goto('/admin/samagri');
  await page.waitForURL('**/admin/samagri', { timeout: 8000 }).catch(() => {});
  await waitForLoad(page);
  await page.waitForTimeout(600);
}

async function selectFirstPooja(page) {
  // poojaSelectWrap contains the SearchableSelect trigger
  const wrap = page.locator('[class*="poojaSelectWrap"]');
  await expect(wrap).toBeVisible({ timeout: 5000 });
  // Open the SearchableSelect dropdown
  const trigger = wrap.locator('[class*="trigger"]');
  await trigger.click();
  await page.waitForTimeout(300);
  // Pick the first available item
  const firstItem = page.locator('[class*="itemLabel"]').first();
  const count = await firstItem.count();
  if (count > 0) {
    await firstItem.click();
    await waitForLoad(page);
    await page.waitForTimeout(500);
  }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 1 — Samagri Page Basics
// ═══════════════════════════════════════════════════════════════════

test.describe('Samagri Management — Page Basics', () => {

  test('TC-SM-01: samagri page loads for admin', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await expect(page.locator('[class*="title"]').first()).toContainText(/साहित्य/i);
  });

  test('TC-SM-02: pooja selector is visible', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await expect(page.locator('[class*="poojaSelectWrap"]')).toBeVisible();
  });

  test('TC-SM-03: placeholder shown before pooja selected', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    const placeholder = page.locator('[class*="placeholder"]');
    await expect(placeholder).toBeVisible();
    await expect(placeholder).toContainText('पूजा निवडा');
  });

  test('TC-SM-04: selecting pooja shows toolbar with Import and + buttons', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await expect(page.locator('button:has-text("Import करा")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("नवीन साहित्य")')).toBeVisible();
  });

  test('TC-SM-05: Marathi units appear in single item form', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("नवीन साहित्य")').click();
    await page.waitForTimeout(400);
    const unitSelect = page.locator('select[name="unit"]');
    await expect(unitSelect).toBeVisible({ timeout: 4000 });
    const options = await unitSelect.locator('option').allInnerTexts();
    expect(options).toContain('नग');
    expect(options).toContain('ग्रॅम');
    expect(options).toContain('किलो');
  });

  test('TC-SM-06: सर्व हटवा button visible when items exist', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    const deleteAllBtn = page.locator('button:has-text("सर्व हटवा")');
    const itemCount = await page.locator('[class*="tableWrap"] tbody tr').count();
    if (itemCount > 0) {
      await expect(deleteAllBtn).toBeVisible({ timeout: 4000 });
      await expect(deleteAllBtn).toContainText(`(${itemCount})`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 2 — Text Import
// ═══════════════════════════════════════════════════════════════════

test.describe('Samagri — Text Import', () => {

  test('TC-TI-01: Import करा button opens import modal', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    const modal = page.locator('[class*="importModal"]');
    await expect(modal).toBeVisible({ timeout: 4000 });
    await expect(modal).toContainText('Import करा');
  });

  test('TC-TI-02: import modal has Text Paste tab active by default', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    const activeTab = page.locator('[class*="importTabActive"]');
    await expect(activeTab).toContainText('Text Paste');
  });

  test('TC-TI-03: import modal has फोटो (AI) tab', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    await expect(page.locator('button:has-text("फोटो (AI)")')).toBeVisible();
  });

  test('TC-TI-04: विश्लेषण करा button disabled when textarea empty', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    const parseBtn = page.locator('button:has-text("विश्लेषण करा")');
    await expect(parseBtn).toBeDisabled();
  });

  test('TC-TI-05: pasting text and parsing shows preview table', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    await page.locator('[class*="importTextarea"]').fill(SAMPLE_TEXT);
    await page.locator('button:has-text("विश्लेषण करा")').click();
    await page.waitForTimeout(500);
    // Use 'table' to avoid strict mode violation (wrapper div also has previewTable in class)
    const previewTable = page.locator('table[class*="previewTable"]');
    await expect(previewTable).toBeVisible({ timeout: 4000 });
    const rows = previewTable.locator('tbody tr');
    await expect(rows).toHaveCount(6, { timeout: 4000 }); // 6 lines in SAMPLE_TEXT
  });

  test('TC-TI-06: preview shows हळद with ग्रॅम unit', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    await page.locator('[class*="importTextarea"]').fill(SAMPLE_TEXT);
    await page.locator('button:has-text("विश्लेषण करा")').click();
    await page.waitForTimeout(500);
    const haldRow = page.locator('table[class*="previewTable"] tbody tr').first();
    const nameInput = haldRow.locator('[class*="previewInput"]').first();
    await expect(nameInput).toHaveValue('हळद');
    const unitSelect = haldRow.locator('select');
    await expect(unitSelect).toHaveValue('ग्रॅम');
  });

  test('TC-TI-07: नारळ auto-gets नग unit', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    await page.locator('[class*="importTextarea"]').fill('नारळ\nसुपारी');
    await page.locator('button:has-text("विश्लेषण करा")').click();
    await page.waitForTimeout(500);
    const rows = page.locator('table[class*="previewTable"] tbody tr');
    const naralUnit = await rows.nth(0).locator('select').inputValue();
    const supariUnit = await rows.nth(1).locator('select').inputValue();
    expect(naralUnit).toBe('नग');
    expect(supariUnit).toBe('नग');
  });

  test('TC-TI-08: preview row can be edited before save', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    await page.locator('[class*="importTextarea"]').fill('हळद - 100 ग्रॅम');
    await page.locator('button:has-text("विश्लेषण करा")').click();
    await page.waitForTimeout(500);
    const nameInput = page.locator('[class*="previewInput"]').first();
    await nameInput.fill('हळद पावडर');
    await expect(nameInput).toHaveValue('हळद पावडर');
  });

  test('TC-TI-09: ✕ removes a row from preview', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    await page.locator('[class*="importTextarea"]').fill('हळद\nसाखर\nतूप');
    await page.locator('button:has-text("विश्लेषण करा")').click();
    await page.waitForTimeout(500);
    const rowsBefore = await page.locator('table[class*="previewTable"] tbody tr').count();
    await page.locator('[class*="rowDelBtn"]').first().click();
    await page.waitForTimeout(300);
    const rowsAfter = await page.locator('table[class*="previewTable"] tbody tr').count();
    expect(rowsAfter).toBe(rowsBefore - 1);
  });

  test('TC-TI-10: ← मागे returns to textarea step', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    await page.locator('[class*="importTextarea"]').fill('हळद');
    await page.locator('button:has-text("विश्लेषण करा")').click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("मागे")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('[class*="importTextarea"]')).toBeVisible();
  });

  test('TC-TI-11: save all adds items and closes modal', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    const beforeCount = await page.locator('[class*="tableWrap"] tbody tr').count();
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    await page.locator('[class*="importTextarea"]').fill('Playwright Import Item 1\nPlaywright Import Item 2');
    await page.locator('button:has-text("विश्लेषण करा")').click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("साहित्य जोडा")').click();
    await waitForLoad(page);
    await page.waitForTimeout(1000);
    // Modal should be closed
    await expect(page.locator('[class*="importModal"]')).toHaveCount(0, { timeout: 5000 });
    // Table should have more items
    const afterCount = await page.locator('[class*="tableWrap"] tbody tr').count();
    expect(afterCount).toBeGreaterThan(beforeCount);
  });

  test('TC-TI-12: numbered/bulleted lines are cleaned in preview', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    await page.locator('[class*="importTextarea"]').fill('1. हळद\n2) साखर\n• तूप\n- नारळ');
    await page.locator('button:has-text("विश्लेषण करा")').click();
    await page.waitForTimeout(500);
    const firstInput = page.locator('[class*="previewInput"]').first();
    await expect(firstInput).toHaveValue('हळद'); // no "1." prefix
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 3 — OCR Tab UI
// ═══════════════════════════════════════════════════════════════════

test.describe('Samagri — OCR Tab UI', () => {

  test('TC-OCR-01: switching to फोटो tab shows upload area', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    await page.locator('button:has-text("फोटो (AI)")').click();
    await page.waitForTimeout(300);
    const uploadArea = page.locator('[class*="uploadArea"]');
    await expect(uploadArea).toBeVisible({ timeout: 4000 });
    await expect(uploadArea).toContainText('इथे click करा');
  });

  test('TC-OCR-02: AI ने वाचा button disabled when no file selected', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    await page.locator('button:has-text("फोटो (AI)")').click();
    await page.waitForTimeout(300);
    const ocrBtn = page.locator('button:has-text("AI ने वाचा")');
    await expect(ocrBtn).toBeDisabled();
  });

  test('TC-OCR-03: uploading image shows preview', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    await page.locator('button:has-text("फोटो (AI)")').click();
    await page.waitForTimeout(300);
    // Create a minimal 1x1 PNG
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(pngBase64, 'base64');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer });
    await page.waitForTimeout(500);
    const preview = page.locator('[class*="ocrPreviewImg"]');
    await expect(preview).toBeVisible({ timeout: 4000 });
  });

  test('TC-OCR-04: file name shown after upload', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    await page.locator('button:has-text("फोटो (AI)")').click();
    await page.waitForTimeout(300);
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    await page.locator('input[type="file"]').setInputFiles({ name: 'samagri-list.png', mimeType: 'image/png', buffer });
    await page.waitForTimeout(400);
    const fileName = page.locator('[class*="ocrFileName"]');
    await expect(fileName).toContainText('samagri-list.png');
  });

  test('TC-OCR-05: AI ने वाचा button enabled after file selected', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    await page.locator('button:has-text("फोटो (AI)")').click();
    await page.waitForTimeout(300);
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    await page.locator('input[type="file"]').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer });
    await page.waitForTimeout(400);
    const ocrBtn = page.locator('button:has-text("AI ने वाचा")');
    await expect(ocrBtn).toBeEnabled({ timeout: 3000 });
  });

  test('TC-OCR-06: closing import modal clears OCR file state', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    await page.locator('button:has-text("फोटो (AI)")').click();
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    await page.locator('input[type="file"]').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer });
    await page.waitForTimeout(400);
    await page.locator('button[class*="closeBtn"]').click();
    await page.waitForTimeout(400);
    // Reopen — file should be cleared
    await page.locator('button:has-text("Import करा")').click();
    await page.waitForTimeout(400);
    await page.locator('button:has-text("फोटो (AI)")').click();
    await expect(page.locator('[class*="uploadPlaceholder"]')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 4 — Bulk Delete
// ═══════════════════════════════════════════════════════════════════

test.describe('Samagri — Bulk Delete', () => {

  test('TC-BD-01: सर्व हटवा shows item count in button label', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    const rows = await page.locator('[class*="tableWrap"] tbody tr').count();
    if (rows > 0) {
      const btn = page.locator('button:has-text("सर्व हटवा")');
      await expect(btn).toContainText(`(${rows})`);
    }
  });

  test('TC-BD-02: सर्व हटवा shows confirmation dialog', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    const rows = await page.locator('[class*="tableWrap"] tbody tr').count();
    if (rows > 0) {
      let dialogShown = false;
      page.on('dialog', async dialog => {
        dialogShown = true;
        await dialog.dismiss(); // cancel — don't actually delete
      });
      await page.locator('button:has-text("सर्व हटवा")').click();
      await page.waitForTimeout(500);
      expect(dialogShown).toBe(true);
    }
  });

  test('TC-BD-03: cancelling confirmation keeps items intact', async ({ page }) => {
    await adminLogin(page);
    await gotoSamagri(page);
    await selectFirstPooja(page);
    const rowsBefore = await page.locator('[class*="tableWrap"] tbody tr').count();
    if (rowsBefore > 0) {
      page.on('dialog', d => d.dismiss());
      await page.locator('button:has-text("सर्व हटवा")').click();
      await page.waitForTimeout(800);
      const rowsAfter = await page.locator('[class*="tableWrap"] tbody tr').count();
      expect(rowsAfter).toBe(rowsBefore);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 5 — Samagri API Backend
// ═══════════════════════════════════════════════════════════════════

test.describe('Samagri API — Bulk & OCR Endpoints', () => {

  let adminToken = '';
  let firstPoojaId = null;

  test.beforeAll(async ({ request }) => {
    const res  = await request.post(`${API_URL}/auth/login`, {
      data: { phone: ADMIN_PHONE, password: ADMIN_PASSWORD },
    });
    if (res.ok()) {
      const body = await res.json();
      adminToken = body.data?.token || '';
    }
    const pRes = await request.get(`${API_URL}/poojas`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (pRes.ok()) {
      const pBody = await pRes.json();
      firstPoojaId = pBody.data?.poojas?.[0]?.id || null;
    }
  });

  test('TC-API-SM-01: POST /admin/samagri/bulk requires auth', async ({ request }) => {
    const res = await request.post(`${API_URL}/admin/samagri/bulk`, {
      data: { pooja_id: 1, items: [{ name_mr: 'Test' }] },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-API-SM-02: POST /admin/samagri/bulk with auth creates items', async ({ request }) => {
    if (!firstPoojaId) return test.skip();
    const res = await request.post(`${API_URL}/admin/samagri/bulk`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        pooja_id: firstPoojaId,
        items: [
          { name_mr: 'API Test Item 1', quantity: '100', unit: 'ग्रॅम', sort_order: 999 },
          { name_mr: 'API Test Item 2', quantity: '2',   unit: 'नग',   sort_order: 1000 },
        ],
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('TC-API-SM-03: POST /admin/samagri/bulk without items returns 400', async ({ request }) => {
    const res = await request.post(`${API_URL}/admin/samagri/bulk`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { pooja_id: 1, items: [] },
    });
    expect(res.status()).toBe(400);
  });

  test('TC-API-SM-04: DELETE /admin/samagri/pooja/:id requires auth', async ({ request }) => {
    const res = await request.delete(`${API_URL}/admin/samagri/pooja/1`);
    expect(res.status()).toBe(401);
  });

  test('TC-API-SM-05: DELETE /admin/samagri/pooja/:id with auth deletes all', async ({ request }) => {
    if (!firstPoojaId) return test.skip();
    const res = await request.delete(`${API_URL}/admin/samagri/pooja/${firstPoojaId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.count).toBe('number');
  });

  test('TC-API-SM-06: POST /admin/samagri/ocr requires auth', async ({ request }) => {
    const res = await request.post(`${API_URL}/admin/samagri/ocr`, {
      multipart: { image: { name: 'test.png', mimeType: 'image/png', buffer: Buffer.from('fake') } },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-API-SM-07: GET /admin/samagri/:id returns items for pooja', async ({ request }) => {
    if (!firstPoojaId) return test.skip();
    const res = await request.get(`${API_URL}/admin/samagri/${firstPoojaId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
