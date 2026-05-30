# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: samagri.spec.js >> Samagri — Text Import >> TC-TI-07: नारळ auto-gets नग unit
- Location: tests\samagri.spec.js:195:3

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Import करा")')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - generic [ref=e9]:
        - generic [ref=e10]: पूजारी
        - generic [ref=e11]: Admin Panel
      - button "←" [ref=e12] [cursor=pointer]
    - navigation [ref=e13]:
      - link "Dashboard" [ref=e14] [cursor=pointer]:
        - /url: /admin/dashboard
        - img [ref=e16]
        - generic [ref=e18]: Dashboard
      - link "📊 Report" [ref=e19] [cursor=pointer]:
        - /url: /admin/report
        - img [ref=e21]
        - generic [ref=e23]: 📊 Report
      - link "Pujari Requests" [ref=e24] [cursor=pointer]:
        - /url: /admin/pujaris/pending
        - img [ref=e26]
        - generic [ref=e28]: Pujari Requests
      - link "Approved Pujaris" [ref=e29] [cursor=pointer]:
        - /url: /admin/pujaris
        - img [ref=e31]
        - generic [ref=e33]: Approved Pujaris
      - link "Bookings" [ref=e34] [cursor=pointer]:
        - /url: /admin/bookings
        - img [ref=e36]
        - generic [ref=e38]: Bookings
      - link "Manage Poojas" [ref=e39] [cursor=pointer]:
        - /url: /admin/poojas
        - img [ref=e41]
        - generic [ref=e43]: Manage Poojas
      - link "Homepage" [ref=e44] [cursor=pointer]:
        - /url: /admin/home
        - img [ref=e46]
        - generic [ref=e48]: Homepage
      - link "Theme Settings" [ref=e49] [cursor=pointer]:
        - /url: /admin/theme
        - img [ref=e51]
        - generic [ref=e53]: Theme Settings
      - link "Kundali Milan" [ref=e54] [cursor=pointer]:
        - /url: /admin/kundali-milan
        - img [ref=e56]
        - generic [ref=e58]: Kundali Milan
      - link "Manage Halls" [ref=e59] [cursor=pointer]:
        - /url: /admin/halls
        - img [ref=e61]
        - generic [ref=e63]: Manage Halls
      - link "Samagri यादी" [ref=e64] [cursor=pointer]:
        - /url: /admin/samagri
        - img [ref=e66]
        - generic [ref=e68]: Samagri यादी
      - link "जन्म पत्रिका" [ref=e69] [cursor=pointer]:
        - /url: /admin/janam-patrika
        - img [ref=e71]
        - generic [ref=e73]: जन्म पत्रिका
      - link "ब्लॉग" [ref=e74] [cursor=pointer]:
        - /url: /admin/blog
        - img [ref=e76]
        - generic [ref=e78]: ब्लॉग
      - link "अभ्यासक" [ref=e79] [cursor=pointer]:
        - /url: /admin/abhyasak
        - img [ref=e81]
        - generic [ref=e83]: अभ्यासक
      - link "अभिप्राय" [ref=e84] [cursor=pointer]:
        - /url: /admin/reviews
        - img [ref=e86]
        - generic [ref=e88]: अभिप्राय
      - link "💳 Plan Upgrade" [ref=e89] [cursor=pointer]:
        - /url: /admin/upgrade-plan
        - img [ref=e91]
        - generic [ref=e93]: 💳 Plan Upgrade
    - generic [ref=e94]:
      - generic [ref=e95]:
        - generic [ref=e96]: Test Admin
        - generic [ref=e97]: admin
      - button "Logout" [ref=e98] [cursor=pointer]:
        - img [ref=e99]
        - generic [ref=e101]: Logout
  - main [ref=e102]:
    - generic [ref=e103]:
      - heading "Samagri यादी" [level=2] [ref=e104]
      - generic [ref=e106]:
        - img [ref=e107]
        - text: Test Admin
    - generic [ref=e110]:
      - heading "🛒 साहित्य व्यवस्थापन" [level=2] [ref=e112]
      - combobox [ref=e114] [cursor=pointer]:
        - option "-- पूजा निवडा --" [selected]
        - option "सत्यनारायण पूजा"
        - option "मुंज / उपनयन संस्कार"
        - option "महा मृत्युंजय जाप"
        - option "दशक्रिया विधी"
        - option "गणपती स्थापना"
        - option "लक्ष्मी पूजन (दिवाळी)"
        - option "गृहप्रवेश व गृहशांती"
        - option "लग्न विधी"
        - option "बाळ शॉवर पूजा"
        - option "वाढदिवस पूजा"
        - option "साखरपुडा पूजा"
        - option "नवग्रह शांती हवन"
        - option "धन्वंतरी हवन"
        - option "सरस्वती हवन"
        - option "गणपती अथर्वशीर्ष हवन"
        - option "नवचंडी याग"
        - option "दत्त याग"
        - option "रुद्राभिषेक"
        - option "मंगळागौरी पूजा"
        - option "सोमवार पूजा"
        - option "सुंदरकांड पाठ"
        - option "बारावे विधी"
        - option "तेरावे विधी"
        - option "वार्षिक श्राद्ध विधी"
        - option "भरणी श्राद्ध"
        - option "त्रिपिंडी श्राद्ध"
        - option "गणपती विसर्जन पूजा"
        - option "कृष्ण जन्माष्टमी"
        - option "नवरात्री घटस्थापना"
        - option "होळी पूजन"
        - option "तुळशी विवाह"
        - option "भूमिपूजन"
        - option "कार्यालय शुभारंभ पूजा"
        - option "वास्तूशांती व उदक शुद्धी"
        - option "नक्षत्र जनन शांती"
        - option "लक्ष्मी हवन"
        - option "गायत्री हवन"
        - option "सुदर्शन हवन"
        - option "चंडी हवन"
        - option "महारुद्र हवन"
        - option "स्वयंवर पार्वती हवन"
        - option "कुबेर हवन"
        - option "काल भैरव हवन"
        - option "लघुरुद्र हवन"
        - option "श्री सूक्त हवन"
        - option "पुरुष सूक्त हवन"
        - option "गर्भाधान संस्कार"
        - option "पुंसवन संस्कार"
        - option "सीमंतोन्नयन संस्कार"
        - option "जातकर्म संस्कार"
        - option "विद्यारंभ संस्कार"
        - option "कर्णवेध संस्कार"
        - option "समावर्तन संस्कार"
        - option "वटसावित्री पूजा"
        - option "महालक्ष्मी व्रत पूजा"
        - option "हरतालिका पूजा"
        - option "गौरी पूजन (गौरी गणपती)"
        - option "चंपाषष्ठी पूजा (खंडोबा)"
        - option "दत्तजयंती विधी"
        - option "नागपंचमी पूजा विधी"
        - option "वारी / पालखी विधी"
        - option "अक्कलकोट स्वामी समर्थ पूजा"
        - option "शनी शिंगणापूर पूजा विधी"
        - option "तुकाराम बीज पूजन"
        - option "त्र्यंबकेश्वर विशेष विधी"
        - option "पाळणा / बारसे विधी"
        - option "सटवाई पूजा"
      - generic [ref=e115]:
        - generic [ref=e116]: 🛒
        - paragraph [ref=e117]: वरून एक पूजा निवडा — त्या पूजेची संपूर्ण साहित्य यादी दिसेल.
```

# Test source

```ts
  99  |     expect(options).toContain('नग');
  100 |     expect(options).toContain('ग्रॅम');
  101 |     expect(options).toContain('किलो');
  102 |   });
  103 | 
  104 |   test('TC-SM-06: सर्व हटवा button visible when items exist', async ({ page }) => {
  105 |     await adminLogin(page);
  106 |     await gotoSamagri(page);
  107 |     await selectFirstPooja(page);
  108 |     const deleteAllBtn = page.locator('button:has-text("सर्व हटवा")');
  109 |     const itemCount = await page.locator('[class*="tableWrap"] tbody tr').count();
  110 |     if (itemCount > 0) {
  111 |       await expect(deleteAllBtn).toBeVisible({ timeout: 4000 });
  112 |       await expect(deleteAllBtn).toContainText(`(${itemCount})`);
  113 |     }
  114 |   });
  115 | });
  116 | 
  117 | // ═══════════════════════════════════════════════════════════════════
  118 | // SECTION 2 — Text Import
  119 | // ═══════════════════════════════════════════════════════════════════
  120 | 
  121 | test.describe('Samagri — Text Import', () => {
  122 | 
  123 |   test('TC-TI-01: Import करा button opens import modal', async ({ page }) => {
  124 |     await adminLogin(page);
  125 |     await gotoSamagri(page);
  126 |     await selectFirstPooja(page);
  127 |     await page.locator('button:has-text("Import करा")').click();
  128 |     await page.waitForTimeout(400);
  129 |     const modal = page.locator('[class*="importModal"]');
  130 |     await expect(modal).toBeVisible({ timeout: 4000 });
  131 |     await expect(modal).toContainText('Import करा');
  132 |   });
  133 | 
  134 |   test('TC-TI-02: import modal has Text Paste tab active by default', async ({ page }) => {
  135 |     await adminLogin(page);
  136 |     await gotoSamagri(page);
  137 |     await selectFirstPooja(page);
  138 |     await page.locator('button:has-text("Import करा")').click();
  139 |     await page.waitForTimeout(400);
  140 |     const activeTab = page.locator('[class*="importTabActive"]');
  141 |     await expect(activeTab).toContainText('Text Paste');
  142 |   });
  143 | 
  144 |   test('TC-TI-03: import modal has फोटो (AI) tab', async ({ page }) => {
  145 |     await adminLogin(page);
  146 |     await gotoSamagri(page);
  147 |     await selectFirstPooja(page);
  148 |     await page.locator('button:has-text("Import करा")').click();
  149 |     await page.waitForTimeout(400);
  150 |     await expect(page.locator('button:has-text("फोटो (AI)")')).toBeVisible();
  151 |   });
  152 | 
  153 |   test('TC-TI-04: विश्लेषण करा button disabled when textarea empty', async ({ page }) => {
  154 |     await adminLogin(page);
  155 |     await gotoSamagri(page);
  156 |     await selectFirstPooja(page);
  157 |     await page.locator('button:has-text("Import करा")').click();
  158 |     await page.waitForTimeout(400);
  159 |     const parseBtn = page.locator('button:has-text("विश्लेषण करा")');
  160 |     await expect(parseBtn).toBeDisabled();
  161 |   });
  162 | 
  163 |   test('TC-TI-05: pasting text and parsing shows preview table', async ({ page }) => {
  164 |     await adminLogin(page);
  165 |     await gotoSamagri(page);
  166 |     await selectFirstPooja(page);
  167 |     await page.locator('button:has-text("Import करा")').click();
  168 |     await page.waitForTimeout(400);
  169 |     await page.locator('[class*="importTextarea"]').fill(SAMPLE_TEXT);
  170 |     await page.locator('button:has-text("विश्लेषण करा")').click();
  171 |     await page.waitForTimeout(500);
  172 |     // Use 'table' to avoid strict mode violation (wrapper div also has previewTable in class)
  173 |     const previewTable = page.locator('table[class*="previewTable"]');
  174 |     await expect(previewTable).toBeVisible({ timeout: 4000 });
  175 |     const rows = previewTable.locator('tbody tr');
  176 |     await expect(rows).toHaveCount(6, { timeout: 4000 }); // 6 lines in SAMPLE_TEXT
  177 |   });
  178 | 
  179 |   test('TC-TI-06: preview shows हळद with ग्रॅम unit', async ({ page }) => {
  180 |     await adminLogin(page);
  181 |     await gotoSamagri(page);
  182 |     await selectFirstPooja(page);
  183 |     await page.locator('button:has-text("Import करा")').click();
  184 |     await page.waitForTimeout(400);
  185 |     await page.locator('[class*="importTextarea"]').fill(SAMPLE_TEXT);
  186 |     await page.locator('button:has-text("विश्लेषण करा")').click();
  187 |     await page.waitForTimeout(500);
  188 |     const haldRow = page.locator('table[class*="previewTable"] tbody tr').first();
  189 |     const nameInput = haldRow.locator('[class*="previewInput"]').first();
  190 |     await expect(nameInput).toHaveValue('हळद');
  191 |     const unitSelect = haldRow.locator('select');
  192 |     await expect(unitSelect).toHaveValue('ग्रॅम');
  193 |   });
  194 | 
  195 |   test('TC-TI-07: नारळ auto-gets नग unit', async ({ page }) => {
  196 |     await adminLogin(page);
  197 |     await gotoSamagri(page);
  198 |     await selectFirstPooja(page);
> 199 |     await page.locator('button:has-text("Import करा")').click();
      |                                                         ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  200 |     await page.waitForTimeout(400);
  201 |     await page.locator('[class*="importTextarea"]').fill('नारळ\nसुपारी');
  202 |     await page.locator('button:has-text("विश्लेषण करा")').click();
  203 |     await page.waitForTimeout(500);
  204 |     const rows = page.locator('table[class*="previewTable"] tbody tr');
  205 |     const naralUnit = await rows.nth(0).locator('select').inputValue();
  206 |     const supariUnit = await rows.nth(1).locator('select').inputValue();
  207 |     expect(naralUnit).toBe('नग');
  208 |     expect(supariUnit).toBe('नग');
  209 |   });
  210 | 
  211 |   test('TC-TI-08: preview row can be edited before save', async ({ page }) => {
  212 |     await adminLogin(page);
  213 |     await gotoSamagri(page);
  214 |     await selectFirstPooja(page);
  215 |     await page.locator('button:has-text("Import करा")').click();
  216 |     await page.waitForTimeout(400);
  217 |     await page.locator('[class*="importTextarea"]').fill('हळद - 100 ग्रॅम');
  218 |     await page.locator('button:has-text("विश्लेषण करा")').click();
  219 |     await page.waitForTimeout(500);
  220 |     const nameInput = page.locator('[class*="previewInput"]').first();
  221 |     await nameInput.fill('हळद पावडर');
  222 |     await expect(nameInput).toHaveValue('हळद पावडर');
  223 |   });
  224 | 
  225 |   test('TC-TI-09: ✕ removes a row from preview', async ({ page }) => {
  226 |     await adminLogin(page);
  227 |     await gotoSamagri(page);
  228 |     await selectFirstPooja(page);
  229 |     await page.locator('button:has-text("Import करा")').click();
  230 |     await page.waitForTimeout(400);
  231 |     await page.locator('[class*="importTextarea"]').fill('हळद\nसाखर\nतूप');
  232 |     await page.locator('button:has-text("विश्लेषण करा")').click();
  233 |     await page.waitForTimeout(500);
  234 |     const rowsBefore = await page.locator('table[class*="previewTable"] tbody tr').count();
  235 |     await page.locator('[class*="rowDelBtn"]').first().click();
  236 |     await page.waitForTimeout(300);
  237 |     const rowsAfter = await page.locator('table[class*="previewTable"] tbody tr').count();
  238 |     expect(rowsAfter).toBe(rowsBefore - 1);
  239 |   });
  240 | 
  241 |   test('TC-TI-10: ← मागे returns to textarea step', async ({ page }) => {
  242 |     await adminLogin(page);
  243 |     await gotoSamagri(page);
  244 |     await selectFirstPooja(page);
  245 |     await page.locator('button:has-text("Import करा")').click();
  246 |     await page.waitForTimeout(400);
  247 |     await page.locator('[class*="importTextarea"]').fill('हळद');
  248 |     await page.locator('button:has-text("विश्लेषण करा")').click();
  249 |     await page.waitForTimeout(500);
  250 |     await page.locator('button:has-text("मागे")').click();
  251 |     await page.waitForTimeout(300);
  252 |     await expect(page.locator('[class*="importTextarea"]')).toBeVisible();
  253 |   });
  254 | 
  255 |   test('TC-TI-11: save all adds items and closes modal', async ({ page }) => {
  256 |     await adminLogin(page);
  257 |     await gotoSamagri(page);
  258 |     await selectFirstPooja(page);
  259 |     const beforeCount = await page.locator('[class*="tableWrap"] tbody tr').count();
  260 |     await page.locator('button:has-text("Import करा")').click();
  261 |     await page.waitForTimeout(400);
  262 |     await page.locator('[class*="importTextarea"]').fill('Playwright Import Item 1\nPlaywright Import Item 2');
  263 |     await page.locator('button:has-text("विश्लेषण करा")').click();
  264 |     await page.waitForTimeout(500);
  265 |     await page.locator('button:has-text("साहित्य जोडा")').click();
  266 |     await waitForLoad(page);
  267 |     await page.waitForTimeout(1000);
  268 |     // Modal should be closed
  269 |     await expect(page.locator('[class*="importModal"]')).toHaveCount(0, { timeout: 5000 });
  270 |     // Table should have more items
  271 |     const afterCount = await page.locator('[class*="tableWrap"] tbody tr').count();
  272 |     expect(afterCount).toBeGreaterThan(beforeCount);
  273 |   });
  274 | 
  275 |   test('TC-TI-12: numbered/bulleted lines are cleaned in preview', async ({ page }) => {
  276 |     await adminLogin(page);
  277 |     await gotoSamagri(page);
  278 |     await selectFirstPooja(page);
  279 |     await page.locator('button:has-text("Import करा")').click();
  280 |     await page.waitForTimeout(400);
  281 |     await page.locator('[class*="importTextarea"]').fill('1. हळद\n2) साखर\n• तूप\n- नारळ');
  282 |     await page.locator('button:has-text("विश्लेषण करा")').click();
  283 |     await page.waitForTimeout(500);
  284 |     const firstInput = page.locator('[class*="previewInput"]').first();
  285 |     await expect(firstInput).toHaveValue('हळद'); // no "1." prefix
  286 |   });
  287 | });
  288 | 
  289 | // ═══════════════════════════════════════════════════════════════════
  290 | // SECTION 3 — OCR Tab UI
  291 | // ═══════════════════════════════════════════════════════════════════
  292 | 
  293 | test.describe('Samagri — OCR Tab UI', () => {
  294 | 
  295 |   test('TC-OCR-01: switching to फोटो tab shows upload area', async ({ page }) => {
  296 |     await adminLogin(page);
  297 |     await gotoSamagri(page);
  298 |     await selectFirstPooja(page);
  299 |     await page.locator('button:has-text("Import करा")').click();
```