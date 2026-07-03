# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: samagri.spec.js >> Samagri — OCR Tab UI >> TC-OCR-04: file name shown after upload
- Location: tests\samagri.spec.js:345:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[class*="poojaSelectWrap"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[class*="poojaSelectWrap"]')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - generic [ref=e6]: 🙏
    - heading "पूजारी" [level=1] [ref=e7]
    - paragraph [ref=e8]: Admin Portal
  - heading "प्रशासक लॉगिन" [level=2] [ref=e9]
  - paragraph [ref=e10]: Admin / Abhyasak साठी
  - generic [ref=e11]:
    - generic [ref=e12]:
      - generic [ref=e13]: 📱 फोन नंबर किंवा ईमेल
      - 'textbox "उदा: 9999999999" [active] [ref=e14]'
    - generic [ref=e15]:
      - generic [ref=e16]: 🔒 पासवर्ड
      - generic [ref=e17]:
        - textbox "आपला पासवर्ड टाका" [ref=e18]
        - button "👁️" [ref=e19] [cursor=pointer]
    - link "पासवर्ड विसरलात?" [ref=e21] [cursor=pointer]:
      - /url: /forgot-password
    - button "🔐 लॉगिन करा" [ref=e22] [cursor=pointer]
  - link "← मुख्य वेबसाईटवर जा" [ref=e24] [cursor=pointer]:
    - /url: /
```

# Test source

```ts
  1   | // e2e/tests/samagri.spec.js
  2   | // Tests: Text Import, OCR tab UI, Bulk Delete, Marathi units,
  3   | //        parseImportText auto-unit (नग), preview table edit, bulk create API
  4   | const { test, expect } = require('@playwright/test');
  5   | 
  6   | const API_URL        = process.env.API_BASE_URL || 'http://localhost:5000/api';
  7   | const ADMIN_PHONE    = '9307720459';
  8   | const ADMIN_PASSWORD = 'Admin@123';
  9   | 
  10  | // Sample import text
  11  | const SAMPLE_TEXT = `हळद - 100 ग्रॅम
  12  | साखर - 250 ग्रॅम
  13  | नारळ - 2 नग
  14  | सुपारी - 10 नग
  15  | तूप - 100 ग्रॅम
  16  | फुलांचा हार`;
  17  | 
  18  | async function waitForLoad(page) {
  19  |   await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  20  | }
  21  | 
  22  | async function adminLogin(page) {
  23  |   const res = await page.request.post(`${API_URL}/auth/login`, {
  24  |     data: { phone: ADMIN_PHONE, password: ADMIN_PASSWORD },
  25  |   });
  26  |   if (res.ok()) {
  27  |     const body = await res.json();
  28  |     await page.goto('/');
  29  |     await page.evaluate(({ tok, usr }) => {
  30  |       if (tok) {
  31  |         localStorage.setItem('pojjari_token', tok);
  32  |         localStorage.setItem('pojjari_user', JSON.stringify(usr));
  33  |       }
  34  |     }, { tok: body.data?.token, usr: body.data?.user });
  35  |   }
  36  | }
  37  | 
  38  | async function gotoSamagri(page) {
  39  |   await page.goto('/admin/samagri');
  40  |   await page.waitForURL('**/admin/samagri', { timeout: 8000 }).catch(() => {});
  41  |   await waitForLoad(page);
  42  |   await page.waitForTimeout(600);
  43  | }
  44  | 
  45  | async function selectFirstPooja(page) {
  46  |   // poojaSelectWrap contains the SearchableSelect trigger
  47  |   const wrap = page.locator('[class*="poojaSelectWrap"]');
> 48  |   await expect(wrap).toBeVisible({ timeout: 5000 });
      |                      ^ Error: expect(locator).toBeVisible() failed
  49  |   // Open the SearchableSelect dropdown
  50  |   const trigger = wrap.locator('[class*="trigger"]');
  51  |   await trigger.click();
  52  |   await page.waitForTimeout(300);
  53  |   // Pick the first available item
  54  |   const firstItem = page.locator('[class*="itemLabel"]').first();
  55  |   const count = await firstItem.count();
  56  |   if (count > 0) {
  57  |     await firstItem.click();
  58  |     await waitForLoad(page);
  59  |     await page.waitForTimeout(500);
  60  |   }
  61  | }
  62  | 
  63  | // ═══════════════════════════════════════════════════════════════════
  64  | // SECTION 1 — Samagri Page Basics
  65  | // ═══════════════════════════════════════════════════════════════════
  66  | 
  67  | test.describe('Samagri Management — Page Basics', () => {
  68  | 
  69  |   test('TC-SM-01: samagri page loads for admin', async ({ page }) => {
  70  |     await adminLogin(page);
  71  |     await gotoSamagri(page);
  72  |     await expect(page.locator('[class*="title"]').first()).toContainText(/साहित्य/i);
  73  |   });
  74  | 
  75  |   test('TC-SM-02: pooja selector is visible', async ({ page }) => {
  76  |     await adminLogin(page);
  77  |     await gotoSamagri(page);
  78  |     await expect(page.locator('[class*="poojaSelectWrap"]')).toBeVisible();
  79  |   });
  80  | 
  81  |   test('TC-SM-03: placeholder shown before pooja selected', async ({ page }) => {
  82  |     await adminLogin(page);
  83  |     await gotoSamagri(page);
  84  |     const placeholder = page.locator('[class*="placeholder"]');
  85  |     await expect(placeholder).toBeVisible();
  86  |     await expect(placeholder).toContainText('पूजा निवडा');
  87  |   });
  88  | 
  89  |   test('TC-SM-04: selecting pooja shows toolbar with Import and + buttons', async ({ page }) => {
  90  |     await adminLogin(page);
  91  |     await gotoSamagri(page);
  92  |     await selectFirstPooja(page);
  93  |     await expect(page.locator('button:has-text("Import करा")')).toBeVisible({ timeout: 5000 });
  94  |     await expect(page.locator('button:has-text("नवीन साहित्य")')).toBeVisible();
  95  |   });
  96  | 
  97  |   test('TC-SM-05: Marathi units appear in single item form', async ({ page }) => {
  98  |     await adminLogin(page);
  99  |     await gotoSamagri(page);
  100 |     await selectFirstPooja(page);
  101 |     await page.locator('button:has-text("नवीन साहित्य")').click();
  102 |     await page.waitForTimeout(400);
  103 |     const unitSelect = page.locator('select[name="unit"]');
  104 |     await expect(unitSelect).toBeVisible({ timeout: 4000 });
  105 |     const options = await unitSelect.locator('option').allInnerTexts();
  106 |     expect(options).toContain('नग');
  107 |     expect(options).toContain('ग्रॅम');
  108 |     expect(options).toContain('किलो');
  109 |   });
  110 | 
  111 |   test('TC-SM-06: सर्व हटवा button visible when items exist', async ({ page }) => {
  112 |     await adminLogin(page);
  113 |     await gotoSamagri(page);
  114 |     await selectFirstPooja(page);
  115 |     const deleteAllBtn = page.locator('button:has-text("सर्व हटवा")');
  116 |     const itemCount = await page.locator('[class*="tableWrap"] tbody tr').count();
  117 |     if (itemCount > 0) {
  118 |       await expect(deleteAllBtn).toBeVisible({ timeout: 4000 });
  119 |       await expect(deleteAllBtn).toContainText(`(${itemCount})`);
  120 |     }
  121 |   });
  122 | });
  123 | 
  124 | // ═══════════════════════════════════════════════════════════════════
  125 | // SECTION 2 — Text Import
  126 | // ═══════════════════════════════════════════════════════════════════
  127 | 
  128 | test.describe('Samagri — Text Import', () => {
  129 | 
  130 |   test('TC-TI-01: Import करा button opens import modal', async ({ page }) => {
  131 |     await adminLogin(page);
  132 |     await gotoSamagri(page);
  133 |     await selectFirstPooja(page);
  134 |     await page.locator('button:has-text("Import करा")').click();
  135 |     await page.waitForTimeout(400);
  136 |     const modal = page.locator('[class*="importModal"]');
  137 |     await expect(modal).toBeVisible({ timeout: 4000 });
  138 |     await expect(modal).toContainText('Import करा');
  139 |   });
  140 | 
  141 |   test('TC-TI-02: import modal has Text Paste tab active by default', async ({ page }) => {
  142 |     await adminLogin(page);
  143 |     await gotoSamagri(page);
  144 |     await selectFirstPooja(page);
  145 |     await page.locator('button:has-text("Import करा")').click();
  146 |     await page.waitForTimeout(400);
  147 |     const activeTab = page.locator('[class*="importTabActive"]');
  148 |     await expect(activeTab).toContainText('Text Paste');
```