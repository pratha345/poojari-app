# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: samagri.spec.js >> Samagri — OCR Tab UI >> TC-OCR-04: file name shown after upload
- Location: tests\samagri.spec.js:338:3

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Import करा")')
    - locator resolved to <button class="_importBtn_4cz8l_17">📋 Import करा</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <input value="" class="_searchInput_4cz8l_13" placeholder="🔍 साहित्य शोधा..."/> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <input value="" class="_searchInput_4cz8l_13" placeholder="🔍 साहित्य शोधा..."/> intercepts pointer events
    - retrying click action
      - waiting 100ms
    3 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="_topbar_wcgdq_168">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="_topbar_wcgdq_168">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <input value="" class="_searchInput_4cz8l_13" placeholder="🔍 साहित्य शोधा..."/> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <input value="" class="_searchInput_4cz8l_13" placeholder="🔍 साहित्य शोधा..."/> intercepts pointer events
    - retrying click action
      - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div class="_topbar_wcgdq_168">…</div> intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - img [ref=e7]
    - navigation [ref=e9]:
      - link [ref=e10] [cursor=pointer]:
        - /url: /admin/dashboard
        - img [ref=e12]
      - link [ref=e14] [cursor=pointer]:
        - /url: /admin/report
        - img [ref=e16]
      - link [ref=e18] [cursor=pointer]:
        - /url: /admin/pujaris/pending
        - img [ref=e20]
      - link [ref=e22] [cursor=pointer]:
        - /url: /admin/pujaris
        - img [ref=e24]
      - link [ref=e26] [cursor=pointer]:
        - /url: /admin/bookings
        - img [ref=e28]
      - link [ref=e30] [cursor=pointer]:
        - /url: /admin/poojas
        - img [ref=e32]
      - link [ref=e34] [cursor=pointer]:
        - /url: /admin/home
        - img [ref=e36]
      - link [ref=e38] [cursor=pointer]:
        - /url: /admin/theme
        - img [ref=e40]
      - link [ref=e42] [cursor=pointer]:
        - /url: /admin/kundali-milan
        - img [ref=e44]
      - link [ref=e46] [cursor=pointer]:
        - /url: /admin/halls
        - img [ref=e48]
      - link [ref=e50] [cursor=pointer]:
        - /url: /admin/samagri
        - img [ref=e52]
      - link [ref=e54] [cursor=pointer]:
        - /url: /admin/janam-patrika
        - img [ref=e56]
      - link [ref=e58] [cursor=pointer]:
        - /url: /admin/blog
        - img [ref=e60]
      - link [ref=e62] [cursor=pointer]:
        - /url: /admin/abhyasak
        - img [ref=e64]
      - link [ref=e66] [cursor=pointer]:
        - /url: /admin/reviews
        - img [ref=e68]
      - link [ref=e70] [cursor=pointer]:
        - /url: /admin/upgrade-plan
        - img [ref=e72]
    - button "Logout" [ref=e75] [cursor=pointer]:
      - img [ref=e76]
      - generic [ref=e78]: Logout
  - main [ref=e79]:
    - generic [ref=e80]:
      - heading "Samagri यादी" [level=2] [ref=e81]
      - generic [ref=e83]:
        - img [ref=e84]
        - text: Test Admin
    - generic [ref=e87]:
      - heading "🛒 साहित्य व्यवस्थापन" [level=2] [ref=e89]
      - generic [ref=e90]:
        - combobox [ref=e91] [cursor=pointer]:
          - option "-- पूजा निवडा --"
          - option "सत्यनारायण पूजा" [selected]
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
        - generic [ref=e92]: 📿 सत्यनारायण पूजा — 2 साहित्य
      - generic [ref=e93]:
        - textbox "🔍 साहित्य शोधा..." [ref=e94]
        - button "📋 Import करा" [ref=e95] [cursor=pointer]
        - button "+ नवीन साहित्य" [ref=e96] [cursor=pointer]
        - button "🗑️ सर्व हटवा (2)" [ref=e97] [cursor=pointer]
      - table [ref=e99]:
        - rowgroup [ref=e100]:
          - 'row "Drag करून क्रम बदला # साहित्य (मराठी) English प्रमाण एकक नोंद Actions" [ref=e101]':
            - columnheader "Drag करून क्रम बदला" [ref=e102]
            - columnheader "#" [ref=e103]
            - columnheader "साहित्य (मराठी)" [ref=e104]
            - columnheader "English" [ref=e105]
            - columnheader "प्रमाण" [ref=e106]
            - columnheader "एकक" [ref=e107]
            - columnheader "नोंद" [ref=e108]
            - columnheader "Actions" [ref=e109]
        - rowgroup [ref=e110]:
          - row "Drag करून क्रम बदला 1 Playwright Import Item 1 — — — — ✏️ 🗑️" [ref=e111]:
            - cell "Drag करून क्रम बदला" [ref=e112]:
              - img [ref=e113]
            - cell "1" [ref=e115]
            - cell "Playwright Import Item 1" [ref=e116]:
              - strong [ref=e117]: Playwright Import Item 1
            - cell "—" [ref=e118]
            - cell "—" [ref=e119]
            - cell "—" [ref=e120]
            - cell "—" [ref=e121]
            - cell "✏️ 🗑️" [ref=e122]:
              - generic [ref=e123]:
                - button "✏️" [ref=e124] [cursor=pointer]
                - button "🗑️" [ref=e125] [cursor=pointer]
          - row "Drag करून क्रम बदला 2 Playwright Import Item 2 — — — — ✏️ 🗑️" [ref=e126]:
            - cell "Drag करून क्रम बदला" [ref=e127]:
              - img [ref=e128]
            - cell "2" [ref=e130]
            - cell "Playwright Import Item 2" [ref=e131]:
              - strong [ref=e132]: Playwright Import Item 2
            - cell "—" [ref=e133]
            - cell "—" [ref=e134]
            - cell "—" [ref=e135]
            - cell "—" [ref=e136]
            - cell "✏️ 🗑️" [ref=e137]:
              - generic [ref=e138]:
                - button "✏️" [ref=e139] [cursor=pointer]
                - button "🗑️" [ref=e140] [cursor=pointer]
```

# Test source

```ts
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
  300 |     await page.waitForTimeout(400);
  301 |     await page.locator('button:has-text("फोटो (AI)")').click();
  302 |     await page.waitForTimeout(300);
  303 |     const uploadArea = page.locator('[class*="uploadArea"]');
  304 |     await expect(uploadArea).toBeVisible({ timeout: 4000 });
  305 |     await expect(uploadArea).toContainText('इथे click करा');
  306 |   });
  307 | 
  308 |   test('TC-OCR-02: AI ने वाचा button disabled when no file selected', async ({ page }) => {
  309 |     await adminLogin(page);
  310 |     await gotoSamagri(page);
  311 |     await selectFirstPooja(page);
  312 |     await page.locator('button:has-text("Import करा")').click();
  313 |     await page.waitForTimeout(400);
  314 |     await page.locator('button:has-text("फोटो (AI)")').click();
  315 |     await page.waitForTimeout(300);
  316 |     const ocrBtn = page.locator('button:has-text("AI ने वाचा")');
  317 |     await expect(ocrBtn).toBeDisabled();
  318 |   });
  319 | 
  320 |   test('TC-OCR-03: uploading image shows preview', async ({ page }) => {
  321 |     await adminLogin(page);
  322 |     await gotoSamagri(page);
  323 |     await selectFirstPooja(page);
  324 |     await page.locator('button:has-text("Import करा")').click();
  325 |     await page.waitForTimeout(400);
  326 |     await page.locator('button:has-text("फोटो (AI)")').click();
  327 |     await page.waitForTimeout(300);
  328 |     // Create a minimal 1x1 PNG
  329 |     const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  330 |     const buffer = Buffer.from(pngBase64, 'base64');
  331 |     const fileInput = page.locator('input[type="file"]');
  332 |     await fileInput.setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer });
  333 |     await page.waitForTimeout(500);
  334 |     const preview = page.locator('[class*="ocrPreviewImg"]');
  335 |     await expect(preview).toBeVisible({ timeout: 4000 });
  336 |   });
  337 | 
  338 |   test('TC-OCR-04: file name shown after upload', async ({ page }) => {
  339 |     await adminLogin(page);
  340 |     await gotoSamagri(page);
  341 |     await selectFirstPooja(page);
> 342 |     await page.locator('button:has-text("Import करा")').click();
      |                                                         ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  343 |     await page.waitForTimeout(400);
  344 |     await page.locator('button:has-text("फोटो (AI)")').click();
  345 |     await page.waitForTimeout(300);
  346 |     const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  347 |     await page.locator('input[type="file"]').setInputFiles({ name: 'samagri-list.png', mimeType: 'image/png', buffer });
  348 |     await page.waitForTimeout(400);
  349 |     const fileName = page.locator('[class*="ocrFileName"]');
  350 |     await expect(fileName).toContainText('samagri-list.png');
  351 |   });
  352 | 
  353 |   test('TC-OCR-05: AI ने वाचा button enabled after file selected', async ({ page }) => {
  354 |     await adminLogin(page);
  355 |     await gotoSamagri(page);
  356 |     await selectFirstPooja(page);
  357 |     await page.locator('button:has-text("Import करा")').click();
  358 |     await page.waitForTimeout(400);
  359 |     await page.locator('button:has-text("फोटो (AI)")').click();
  360 |     await page.waitForTimeout(300);
  361 |     const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  362 |     await page.locator('input[type="file"]').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer });
  363 |     await page.waitForTimeout(400);
  364 |     const ocrBtn = page.locator('button:has-text("AI ने वाचा")');
  365 |     await expect(ocrBtn).toBeEnabled({ timeout: 3000 });
  366 |   });
  367 | 
  368 |   test('TC-OCR-06: closing import modal clears OCR file state', async ({ page }) => {
  369 |     await adminLogin(page);
  370 |     await gotoSamagri(page);
  371 |     await selectFirstPooja(page);
  372 |     await page.locator('button:has-text("Import करा")').click();
  373 |     await page.waitForTimeout(400);
  374 |     await page.locator('button:has-text("फोटो (AI)")').click();
  375 |     const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  376 |     await page.locator('input[type="file"]').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer });
  377 |     await page.waitForTimeout(400);
  378 |     await page.locator('button[class*="closeBtn"]').click();
  379 |     await page.waitForTimeout(400);
  380 |     // Reopen — file should be cleared
  381 |     await page.locator('button:has-text("Import करा")').click();
  382 |     await page.waitForTimeout(400);
  383 |     await page.locator('button:has-text("फोटो (AI)")').click();
  384 |     await expect(page.locator('[class*="uploadPlaceholder"]')).toBeVisible();
  385 |   });
  386 | });
  387 | 
  388 | // ═══════════════════════════════════════════════════════════════════
  389 | // SECTION 4 — Bulk Delete
  390 | // ═══════════════════════════════════════════════════════════════════
  391 | 
  392 | test.describe('Samagri — Bulk Delete', () => {
  393 | 
  394 |   test('TC-BD-01: सर्व हटवा shows item count in button label', async ({ page }) => {
  395 |     await adminLogin(page);
  396 |     await gotoSamagri(page);
  397 |     await selectFirstPooja(page);
  398 |     const rows = await page.locator('[class*="tableWrap"] tbody tr').count();
  399 |     if (rows > 0) {
  400 |       const btn = page.locator('button:has-text("सर्व हटवा")');
  401 |       await expect(btn).toContainText(`(${rows})`);
  402 |     }
  403 |   });
  404 | 
  405 |   test('TC-BD-02: सर्व हटवा shows confirmation dialog', async ({ page }) => {
  406 |     await adminLogin(page);
  407 |     await gotoSamagri(page);
  408 |     await selectFirstPooja(page);
  409 |     const rows = await page.locator('[class*="tableWrap"] tbody tr').count();
  410 |     if (rows > 0) {
  411 |       let dialogShown = false;
  412 |       page.on('dialog', async dialog => {
  413 |         dialogShown = true;
  414 |         await dialog.dismiss(); // cancel — don't actually delete
  415 |       });
  416 |       await page.locator('button:has-text("सर्व हटवा")').click();
  417 |       await page.waitForTimeout(500);
  418 |       expect(dialogShown).toBe(true);
  419 |     }
  420 |   });
  421 | 
  422 |   test('TC-BD-03: cancelling confirmation keeps items intact', async ({ page }) => {
  423 |     await adminLogin(page);
  424 |     await gotoSamagri(page);
  425 |     await selectFirstPooja(page);
  426 |     const rowsBefore = await page.locator('[class*="tableWrap"] tbody tr').count();
  427 |     if (rowsBefore > 0) {
  428 |       page.on('dialog', d => d.dismiss());
  429 |       await page.locator('button:has-text("सर्व हटवा")').click();
  430 |       await page.waitForTimeout(800);
  431 |       const rowsAfter = await page.locator('[class*="tableWrap"] tbody tr').count();
  432 |       expect(rowsAfter).toBe(rowsBefore);
  433 |     }
  434 |   });
  435 | });
  436 | 
  437 | // ═══════════════════════════════════════════════════════════════════
  438 | // SECTION 5 — Samagri API Backend
  439 | // ═══════════════════════════════════════════════════════════════════
  440 | 
  441 | test.describe('Samagri API — Bulk & OCR Endpoints', () => {
  442 | 
```