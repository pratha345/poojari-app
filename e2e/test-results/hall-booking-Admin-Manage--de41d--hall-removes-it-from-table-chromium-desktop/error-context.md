# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hall-booking.spec.js >> Admin Manage Halls — District/Taluka + Map >> TC-AH-12: delete hall removes it from table
- Location: tests\hall-booking.spec.js:447:3

# Error details

```
Error: locator.click: Error: strict mode violation: locator('tr:has(td:has-text("Playwright Test Mangal Karyalay"))').locator('button:has-text("Delete")') resolved to 8 elements:
    1) <button class="_delBtn_qnteh_25">🗑️ Delete</button> aka getByRole('button', { name: '🗑️ Delete' }).first()
    2) <button class="_delBtn_qnteh_25">🗑️ Delete</button> aka getByRole('button', { name: '🗑️ Delete' }).nth(1)
    3) <button class="_delBtn_qnteh_25">🗑️ Delete</button> aka getByRole('button', { name: '🗑️ Delete' }).nth(2)
    4) <button class="_delBtn_qnteh_25">🗑️ Delete</button> aka getByRole('button', { name: '🗑️ Delete' }).nth(3)
    5) <button class="_delBtn_qnteh_25">🗑️ Delete</button> aka getByRole('button', { name: '🗑️ Delete' }).nth(4)
    6) <button class="_delBtn_qnteh_25">🗑️ Delete</button> aka getByRole('button', { name: '🗑️ Delete' }).nth(5)
    7) <button class="_delBtn_qnteh_25">🗑️ Delete</button> aka locator('tr:nth-child(7) > td:nth-child(8) > ._actions_qnteh_24 > ._delBtn_qnteh_25')
    8) <button class="_delBtn_qnteh_25">🗑️ Delete</button> aka locator('tr:nth-child(8) > td:nth-child(8) > ._actions_qnteh_24 > ._delBtn_qnteh_25')

Call log:
  - waiting for locator('tr:has(td:has-text("Playwright Test Mangal Karyalay"))').locator('button:has-text("Delete")')

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
      - heading "Manage Halls" [level=2] [ref=e104]
      - generic [ref=e106]:
        - img [ref=e107]
        - text: Test Admin
    - generic [ref=e110]:
      - generic [ref=e111]:
        - heading "🏛️ Hall Management" [level=2] [ref=e112]
        - button "+ नवीन हॉल जोडा" [ref=e113] [cursor=pointer]
      - table [ref=e115]:
        - rowgroup [ref=e116]:
          - row "# नाव जिल्हा / तालुका फोन क्षमता भाडे/दिवस Location Actions" [ref=e117]:
            - columnheader "#" [ref=e118]
            - columnheader "नाव" [ref=e119]
            - columnheader "जिल्हा / तालुका" [ref=e120]
            - columnheader "फोन" [ref=e121]
            - columnheader "क्षमता" [ref=e122]
            - columnheader "भाडे/दिवस" [ref=e123]
            - columnheader "Location" [ref=e124]
            - columnheader "Actions" [ref=e125]
        - rowgroup [ref=e126]:
          - row "1 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e127]:
            - cell "1" [ref=e128]
            - cell "Playwright Test Mangal Karyalay" [ref=e129]:
              - strong [ref=e130]: Playwright Test Mangal Karyalay
            - cell "पुणे" [ref=e131]
            - cell "9876543210" [ref=e132]
            - cell "300 व्यक्ती" [ref=e133]
            - cell "₹20,000" [ref=e134]
            - cell "📍 Set" [ref=e135]
            - cell "✏️ Edit 🗑️ Delete" [ref=e136]:
              - generic [ref=e137]:
                - button "✏️ Edit" [ref=e138] [cursor=pointer]
                - button "🗑️ Delete" [ref=e139] [cursor=pointer]
          - row "2 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e140]:
            - cell "2" [ref=e141]
            - cell "Playwright Test Mangal Karyalay" [ref=e142]:
              - strong [ref=e143]: Playwright Test Mangal Karyalay
            - cell "पुणे" [ref=e144]
            - cell "9876543210" [ref=e145]
            - cell "300 व्यक्ती" [ref=e146]
            - cell "₹20,000" [ref=e147]
            - cell "📍 Set" [ref=e148]
            - cell "✏️ Edit 🗑️ Delete" [ref=e149]:
              - generic [ref=e150]:
                - button "✏️ Edit" [ref=e151] [cursor=pointer]
                - button "🗑️ Delete" [ref=e152] [cursor=pointer]
          - row "3 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e153]:
            - cell "3" [ref=e154]
            - cell "Playwright Test Mangal Karyalay" [ref=e155]:
              - strong [ref=e156]: Playwright Test Mangal Karyalay
            - cell "पुणे" [ref=e157]
            - cell "9876543210" [ref=e158]
            - cell "300 व्यक्ती" [ref=e159]
            - cell "₹20,000" [ref=e160]
            - cell "📍 Set" [ref=e161]
            - cell "✏️ Edit 🗑️ Delete" [ref=e162]:
              - generic [ref=e163]:
                - button "✏️ Edit" [ref=e164] [cursor=pointer]
                - button "🗑️ Delete" [ref=e165] [cursor=pointer]
          - row "4 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e166]:
            - cell "4" [ref=e167]
            - cell "Playwright Test Mangal Karyalay" [ref=e168]:
              - strong [ref=e169]: Playwright Test Mangal Karyalay
            - cell "पुणे" [ref=e170]
            - cell "9876543210" [ref=e171]
            - cell "300 व्यक्ती" [ref=e172]
            - cell "₹20,000" [ref=e173]
            - cell "📍 Set" [ref=e174]
            - cell "✏️ Edit 🗑️ Delete" [ref=e175]:
              - generic [ref=e176]:
                - button "✏️ Edit" [ref=e177] [cursor=pointer]
                - button "🗑️ Delete" [ref=e178] [cursor=pointer]
          - row "5 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e179]:
            - cell "5" [ref=e180]
            - cell "Playwright Test Mangal Karyalay" [ref=e181]:
              - strong [ref=e182]: Playwright Test Mangal Karyalay
            - cell "पुणे" [ref=e183]
            - cell "9876543210" [ref=e184]
            - cell "300 व्यक्ती" [ref=e185]
            - cell "₹20,000" [ref=e186]
            - cell "📍 Set" [ref=e187]
            - cell "✏️ Edit 🗑️ Delete" [ref=e188]:
              - generic [ref=e189]:
                - button "✏️ Edit" [ref=e190] [cursor=pointer]
                - button "🗑️ Delete" [ref=e191] [cursor=pointer]
          - row "6 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e192]:
            - cell "6" [ref=e193]
            - cell "Playwright Test Mangal Karyalay" [ref=e194]:
              - strong [ref=e195]: Playwright Test Mangal Karyalay
            - cell "पुणे" [ref=e196]
            - cell "9876543210" [ref=e197]
            - cell "300 व्यक्ती" [ref=e198]
            - cell "₹20,000" [ref=e199]
            - cell "📍 Set" [ref=e200]
            - cell "✏️ Edit 🗑️ Delete" [ref=e201]:
              - generic [ref=e202]:
                - button "✏️ Edit" [ref=e203] [cursor=pointer]
                - button "🗑️ Delete" [ref=e204] [cursor=pointer]
          - row "7 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e205]:
            - cell "7" [ref=e206]
            - cell "Playwright Test Mangal Karyalay" [ref=e207]:
              - strong [ref=e208]: Playwright Test Mangal Karyalay
            - cell "पुणे" [ref=e209]
            - cell "9876543210" [ref=e210]
            - cell "300 व्यक्ती" [ref=e211]
            - cell "₹20,000" [ref=e212]
            - cell "📍 Set" [ref=e213]
            - cell "✏️ Edit 🗑️ Delete" [ref=e214]:
              - generic [ref=e215]:
                - button "✏️ Edit" [ref=e216] [cursor=pointer]
                - button "🗑️ Delete" [ref=e217] [cursor=pointer]
          - row "8 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e218]:
            - cell "8" [ref=e219]
            - cell "Playwright Test Mangal Karyalay" [ref=e220]:
              - strong [ref=e221]: Playwright Test Mangal Karyalay
            - cell "पुणे" [ref=e222]
            - cell "9876543210" [ref=e223]
            - cell "300 व्यक्ती" [ref=e224]
            - cell "₹20,000" [ref=e225]
            - cell "📍 Set" [ref=e226]
            - cell "✏️ Edit 🗑️ Delete" [ref=e227]:
              - generic [ref=e228]:
                - button "✏️ Edit" [ref=e229] [cursor=pointer]
                - button "🗑️ Delete" [ref=e230] [cursor=pointer]
          - row "9 सुवर्ण मंगल कार्यालय पुणे 9876543210 500 व्यक्ती ₹25,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e231]:
            - cell "9" [ref=e232]
            - cell "सुवर्ण मंगल कार्यालय" [ref=e233]:
              - strong [ref=e234]: सुवर्ण मंगल कार्यालय
            - cell "पुणे" [ref=e235]
            - cell "9876543210" [ref=e236]
            - cell "500 व्यक्ती" [ref=e237]
            - cell "₹25,000" [ref=e238]
            - cell "📍 Set" [ref=e239]
            - cell "✏️ Edit 🗑️ Delete" [ref=e240]:
              - generic [ref=e241]:
                - button "✏️ Edit" [ref=e242] [cursor=pointer]
                - button "🗑️ Delete" [ref=e243] [cursor=pointer]
          - row "10 शुभ विवाह हॉल पुणे 9988776655 300 व्यक्ती ₹18,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e244]:
            - cell "10" [ref=e245]
            - cell "शुभ विवाह हॉल" [ref=e246]:
              - strong [ref=e247]: शुभ विवाह हॉल
            - cell "पुणे" [ref=e248]
            - cell "9988776655" [ref=e249]
            - cell "300 व्यक्ती" [ref=e250]
            - cell "₹18,000" [ref=e251]
            - cell "📍 Set" [ref=e252]
            - cell "✏️ Edit 🗑️ Delete" [ref=e253]:
              - generic [ref=e254]:
                - button "✏️ Edit" [ref=e255] [cursor=pointer]
                - button "🗑️ Delete" [ref=e256] [cursor=pointer]
          - row "11 गजानन मंगल कार्यालय पुणे 9123456789 400 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e257]:
            - cell "11" [ref=e258]
            - cell "गजानन मंगल कार्यालय" [ref=e259]:
              - strong [ref=e260]: गजानन मंगल कार्यालय
            - cell "पुणे" [ref=e261]
            - cell "9123456789" [ref=e262]
            - cell "400 व्यक्ती" [ref=e263]
            - cell "₹20,000" [ref=e264]
            - cell "📍 Set" [ref=e265]
            - cell "✏️ Edit 🗑️ Delete" [ref=e266]:
              - generic [ref=e267]:
                - button "✏️ Edit" [ref=e268] [cursor=pointer]
                - button "🗑️ Delete" [ref=e269] [cursor=pointer]
```

# Test source

```ts
  353 |       const all = [...document.querySelectorAll('.leaflet-container')];
  354 |       const el = all[all.length - 1];
  355 |       if (!el) return;
  356 |       const rect = el.getBoundingClientRect();
  357 |       const cx = rect.left + rect.width * 0.4;
  358 |       const cy = rect.top  + rect.height * 0.4;
  359 |       // Dispatch a realistic MouseEvent with coordinates
  360 |       ['mousedown','mouseup','click'].forEach(type => {
  361 |         el.dispatchEvent(new MouseEvent(type, {
  362 |           bubbles: true, cancelable: true, view: window,
  363 |           clientX: cx, clientY: cy, screenX: cx, screenY: cy,
  364 |         }));
  365 |       });
  366 |     });
  367 | 
  368 |     // Wait until lat input is populated (up to 5s)
  369 |     await page.waitForFunction(
  370 |       () => { const i = document.querySelector('input[name="latitude"]'); return i && i.value !== ''; },
  371 |       { timeout: 5000 }
  372 |     ).catch(() => {});
  373 | 
  374 |     const lat = await page.locator('input[name="latitude"]').inputValue();
  375 |     expect(lat).not.toBe('');
  376 |     expect(parseFloat(lat)).not.toBeNaN();
  377 |     expect(parseFloat(lat)).toBeGreaterThan(0);
  378 |   });
  379 | 
  380 |   test('TC-AH-07: map legend is visible with hall markers description', async ({ page }) => {
  381 |     await adminLogin(page);
  382 |     await gotoHalls(page);
  383 |     await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
  384 |     await page.waitForTimeout(1000);
  385 |     const legend = page.locator('[class*="mapLegend"]');
  386 |     await expect(legend).toBeVisible({ timeout: 6000 });
  387 |     await expect(legend).toContainText('नोंदणीकृत हॉल');
  388 |     await expect(legend).toContainText('निवडलेले location');
  389 |   });
  390 | 
  391 |   test('TC-AH-08: admin can add hall with district and taluka', async ({ page }) => {
  392 |     await adminLogin(page);
  393 |     await gotoHalls(page);
  394 |     await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
  395 |     await page.waitForTimeout(600);
  396 |     // Fill basic fields
  397 |     await page.locator('input[name="name"]').fill(TEST_HALL.name);
  398 |     await page.locator('input[name="phone"]').fill(TEST_HALL.phone);
  399 |     await page.locator('input[name="whatsapp"]').fill(TEST_HALL.whatsapp);
  400 |     await page.locator('input[name="address"]').fill(TEST_HALL.address);
  401 |     await page.locator('input[name="capacity"]').fill(TEST_HALL.capacity);
  402 |     await page.locator('input[name="price_per_day"]').fill(TEST_HALL.price_per_day);
  403 |     // Select district
  404 |     await page.locator('[class*="trigger"]').first().click();
  405 |     await page.locator('[class*="searchInput"]').first().fill('pune');
  406 |     await page.waitForTimeout(300);
  407 |     await page.locator('[class*="itemLabel"]').filter({ hasText: /^पुणे$/ }).first().click();
  408 |     await page.waitForTimeout(3000); // wait for geocoding
  409 |     // Set manual lat/lng
  410 |     await page.locator('input[name="latitude"]').fill('18.5204');
  411 |     await page.locator('input[name="longitude"]').fill('73.8567');
  412 |     await page.locator('button:has-text("✅ जोडा")').click();
  413 |     await waitForLoad(page);
  414 |     await expect(page.locator('[class*="modal_"]')).toHaveCount(0, { timeout: 6000 });
  415 |     await expect(page.locator(`td:has-text("${TEST_HALL.name}")`)).toBeVisible({ timeout: 8000 });
  416 |   });
  417 | 
  418 |   test('TC-AH-09: table shows जिल्हा/तालुका column', async ({ page }) => {
  419 |     await adminLogin(page);
  420 |     await gotoHalls(page);
  421 |     const header = page.locator('th:has-text("जिल्हा")');
  422 |     await expect(header).toBeVisible({ timeout: 5000 });
  423 |   });
  424 | 
  425 |   test('TC-AH-10: hall row shows district in जिल्हा column', async ({ page }) => {
  426 |     await adminLogin(page);
  427 |     await gotoHalls(page);
  428 |     const hallRow = page.locator(`tr:has(td:has-text("${TEST_HALL.name}"))`);
  429 |     if (await hallRow.count() > 0) {
  430 |       await expect(hallRow).toContainText('पुणे');
  431 |     }
  432 |   });
  433 | 
  434 |   test('TC-AH-11: edit form pre-fills district and taluka', async ({ page }) => {
  435 |     await adminLogin(page);
  436 |     await gotoHalls(page);
  437 |     const hallRow = page.locator(`tr:has(td:has-text("${TEST_HALL.name}"))`);
  438 |     if (await hallRow.count() > 0) {
  439 |       await hallRow.locator('button:has-text("Edit")').click();
  440 |       await page.waitForTimeout(600);
  441 |       // District trigger should show पुणे
  442 |       const distTrigger = page.locator('[class*="trigger"]').first();
  443 |       await expect(distTrigger).toContainText('पुणे', { timeout: 4000 });
  444 |     }
  445 |   });
  446 | 
  447 |   test('TC-AH-12: delete hall removes it from table', async ({ page }) => {
  448 |     await adminLogin(page);
  449 |     await gotoHalls(page);
  450 |     const hallRow = page.locator(`tr:has(td:has-text("${TEST_HALL.name}"))`);
  451 |     if (await hallRow.count() > 0) {
  452 |       page.on('dialog', d => d.accept());
> 453 |       await hallRow.locator('button:has-text("Delete")').click();
      |                                                          ^ Error: locator.click: Error: strict mode violation: locator('tr:has(td:has-text("Playwright Test Mangal Karyalay"))').locator('button:has-text("Delete")') resolved to 8 elements:
  454 |       await page.waitForTimeout(2000);
  455 |       await expect(page.locator(`td:has-text("${TEST_HALL.name}")`)).toHaveCount(0, { timeout: 6000 });
  456 |     }
  457 |   });
  458 | 
  459 |   test('TC-AH-13: close button dismisses form without saving', async ({ page }) => {
  460 |     await adminLogin(page);
  461 |     await gotoHalls(page);
  462 |     await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
  463 |     await page.waitForTimeout(500);
  464 |     await page.locator('button[class*="closeBtn"]').click();
  465 |     await expect(page.locator('[class*="modal_"]')).toHaveCount(0, { timeout: 3000 });
  466 |   });
  467 | });
  468 | 
  469 | // ═══════════════════════════════════════════════════════════════════
  470 | // SECTION 3 — Hall API Backend
  471 | // ═══════════════════════════════════════════════════════════════════
  472 | 
  473 | test.describe('Hall API — District/Taluka Filtering', () => {
  474 | 
  475 |   test('TC-API-01: GET /api/halls returns all halls', async ({ request }) => {
  476 |     const res  = await request.get(`${API_URL}/halls`);
  477 |     const body = await res.json();
  478 |     expect(res.ok()).toBeTruthy();
  479 |     expect(body.success).toBe(true);
  480 |     expect(Array.isArray(body.data)).toBe(true);
  481 |   });
  482 | 
  483 |   test('TC-API-02: GET /api/halls?district= filters by district', async ({ request }) => {
  484 |     const res  = await request.get(`${API_URL}/halls?district=पुणे`);
  485 |     const body = await res.json();
  486 |     expect(res.ok()).toBeTruthy();
  487 |     body.data.forEach(h => expect(h.district).toBe('पुणे'));
  488 |   });
  489 | 
  490 |   test('TC-API-03: GET /api/halls?district=&taluka= filters by both', async ({ request }) => {
  491 |     const res  = await request.get(`${API_URL}/halls?district=रत्नागिरी&taluka=खेड`);
  492 |     const body = await res.json();
  493 |     expect(res.ok()).toBeTruthy();
  494 |     body.data.forEach(h => {
  495 |       expect(h.district).toBe('रत्नागिरी');
  496 |       expect(h.taluka).toBe('खेड');
  497 |     });
  498 |   });
  499 | 
  500 |   test('TC-API-04: GET /api/halls?city= falls back to city LIKE search', async ({ request }) => {
  501 |     const res  = await request.get(`${API_URL}/halls?city=Pune`);
  502 |     const body = await res.json();
  503 |     expect(res.ok()).toBeTruthy();
  504 |     expect(Array.isArray(body.data)).toBe(true);
  505 |   });
  506 | 
  507 |   test('TC-API-05: GET /api/halls/nearby requires lat & lng', async ({ request }) => {
  508 |     const res = await request.get(`${API_URL}/halls/nearby`);
  509 |     expect(res.status()).toBe(400);
  510 |   });
  511 | 
  512 |   test('TC-API-06: GET /api/halls/nearby with coords returns within 40km', async ({ request }) => {
  513 |     const res  = await request.get(`${API_URL}/halls/nearby?lat=19.076&lng=72.877`);
  514 |     const body = await res.json();
  515 |     expect(res.ok()).toBeTruthy();
  516 |     body.data.forEach(h => {
  517 |       if (h.distance != null) expect(h.distance).toBeLessThanOrEqual(40);
  518 |     });
  519 |   });
  520 | 
  521 |   test('TC-API-07: POST /api/admin/halls without auth returns 401', async ({ request }) => {
  522 |     const res = await request.post(`${API_URL}/admin/halls`, {
  523 |       data: { name: 'Test', phone: '1234567890' },
  524 |     });
  525 |     expect(res.status()).toBe(401);
  526 |   });
  527 | 
  528 |   test('TC-API-08: hall data includes district and taluka fields', async ({ request }) => {
  529 |     const res  = await request.get(`${API_URL}/halls`);
  530 |     const body = await res.json();
  531 |     if (body.data.length > 0) {
  532 |       const hall = body.data[0];
  533 |       expect(Object.prototype.hasOwnProperty.call(hall, 'district')).toBe(true);
  534 |       expect(Object.prototype.hasOwnProperty.call(hall, 'taluka')).toBe(true);
  535 |     }
  536 |   });
  537 | });
  538 | 
```