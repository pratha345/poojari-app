# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hall-booking.spec.js >> Admin Manage Halls — District/Taluka + Map >> TC-AH-08: admin can add hall with district and taluka
- Location: tests\hall-booking.spec.js:391:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('td:has-text("Playwright Test Mangal Karyalay")')
Expected: visible
Error: strict mode violation: locator('td:has-text("Playwright Test Mangal Karyalay")') resolved to 8 elements:
    1) <td>…</td> aka getByRole('cell', { name: 'Playwright Test Mangal' }).first()
    2) <td>…</td> aka getByRole('cell', { name: 'Playwright Test Mangal' }).nth(1)
    3) <td>…</td> aka getByRole('cell', { name: 'Playwright Test Mangal' }).nth(2)
    4) <td>…</td> aka getByRole('cell', { name: 'Playwright Test Mangal' }).nth(3)
    5) <td>…</td> aka getByRole('cell', { name: 'Playwright Test Mangal' }).nth(4)
    6) <td>…</td> aka getByRole('cell', { name: 'Playwright Test Mangal' }).nth(5)
    7) <td>…</td> aka locator('tr:nth-child(7) > td:nth-child(2)')
    8) <td>…</td> aka locator('tr:nth-child(8) > td:nth-child(2)')

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for locator('td:has-text("Playwright Test Mangal Karyalay")')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - status [ref=e8]: हॉल जोडला!
  - generic [ref=e9]:
    - complementary [ref=e10]:
      - generic [ref=e11]:
        - img [ref=e13]
        - generic [ref=e15]:
          - generic [ref=e16]: पूजारी
          - generic [ref=e17]: Admin Panel
        - button "←" [ref=e18] [cursor=pointer]
      - navigation [ref=e19]:
        - link "Dashboard" [ref=e20] [cursor=pointer]:
          - /url: /admin/dashboard
          - img [ref=e22]
          - generic [ref=e24]: Dashboard
        - link "📊 Report" [ref=e25] [cursor=pointer]:
          - /url: /admin/report
          - img [ref=e27]
          - generic [ref=e29]: 📊 Report
        - link "Pujari Requests" [ref=e30] [cursor=pointer]:
          - /url: /admin/pujaris/pending
          - img [ref=e32]
          - generic [ref=e34]: Pujari Requests
        - link "Approved Pujaris" [ref=e35] [cursor=pointer]:
          - /url: /admin/pujaris
          - img [ref=e37]
          - generic [ref=e39]: Approved Pujaris
        - link "Bookings" [ref=e40] [cursor=pointer]:
          - /url: /admin/bookings
          - img [ref=e42]
          - generic [ref=e44]: Bookings
        - link "Manage Poojas" [ref=e45] [cursor=pointer]:
          - /url: /admin/poojas
          - img [ref=e47]
          - generic [ref=e49]: Manage Poojas
        - link "Homepage" [ref=e50] [cursor=pointer]:
          - /url: /admin/home
          - img [ref=e52]
          - generic [ref=e54]: Homepage
        - link "Theme Settings" [ref=e55] [cursor=pointer]:
          - /url: /admin/theme
          - img [ref=e57]
          - generic [ref=e59]: Theme Settings
        - link "Kundali Milan" [ref=e60] [cursor=pointer]:
          - /url: /admin/kundali-milan
          - img [ref=e62]
          - generic [ref=e64]: Kundali Milan
        - link "Manage Halls" [ref=e65] [cursor=pointer]:
          - /url: /admin/halls
          - img [ref=e67]
          - generic [ref=e69]: Manage Halls
        - link "Samagri यादी" [ref=e70] [cursor=pointer]:
          - /url: /admin/samagri
          - img [ref=e72]
          - generic [ref=e74]: Samagri यादी
        - link "जन्म पत्रिका" [ref=e75] [cursor=pointer]:
          - /url: /admin/janam-patrika
          - img [ref=e77]
          - generic [ref=e79]: जन्म पत्रिका
        - link "ब्लॉग" [ref=e80] [cursor=pointer]:
          - /url: /admin/blog
          - img [ref=e82]
          - generic [ref=e84]: ब्लॉग
        - link "अभ्यासक" [ref=e85] [cursor=pointer]:
          - /url: /admin/abhyasak
          - img [ref=e87]
          - generic [ref=e89]: अभ्यासक
        - link "अभिप्राय" [ref=e90] [cursor=pointer]:
          - /url: /admin/reviews
          - img [ref=e92]
          - generic [ref=e94]: अभिप्राय
        - link "💳 Plan Upgrade" [ref=e95] [cursor=pointer]:
          - /url: /admin/upgrade-plan
          - img [ref=e97]
          - generic [ref=e99]: 💳 Plan Upgrade
      - generic [ref=e100]:
        - generic [ref=e101]:
          - generic [ref=e102]: Test Admin
          - generic [ref=e103]: admin
        - button "Logout" [ref=e104] [cursor=pointer]:
          - img [ref=e105]
          - generic [ref=e107]: Logout
    - main [ref=e108]:
      - generic [ref=e109]:
        - heading "Manage Halls" [level=2] [ref=e110]
        - generic [ref=e112]:
          - img [ref=e113]
          - text: Test Admin
      - generic [ref=e116]:
        - generic [ref=e117]:
          - heading "🏛️ Hall Management" [level=2] [ref=e118]
          - button "+ नवीन हॉल जोडा" [ref=e119] [cursor=pointer]
        - table [ref=e121]:
          - rowgroup [ref=e122]:
            - row "# नाव जिल्हा / तालुका फोन क्षमता भाडे/दिवस Location Actions" [ref=e123]:
              - columnheader "#" [ref=e124]
              - columnheader "नाव" [ref=e125]
              - columnheader "जिल्हा / तालुका" [ref=e126]
              - columnheader "फोन" [ref=e127]
              - columnheader "क्षमता" [ref=e128]
              - columnheader "भाडे/दिवस" [ref=e129]
              - columnheader "Location" [ref=e130]
              - columnheader "Actions" [ref=e131]
          - rowgroup [ref=e132]:
            - row "1 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e133]:
              - cell "1" [ref=e134]
              - cell "Playwright Test Mangal Karyalay" [ref=e135]:
                - strong [ref=e136]: Playwright Test Mangal Karyalay
              - cell "पुणे" [ref=e137]
              - cell "9876543210" [ref=e138]
              - cell "300 व्यक्ती" [ref=e139]
              - cell "₹20,000" [ref=e140]
              - cell "📍 Set" [ref=e141]
              - cell "✏️ Edit 🗑️ Delete" [ref=e142]:
                - generic [ref=e143]:
                  - button "✏️ Edit" [ref=e144] [cursor=pointer]
                  - button "🗑️ Delete" [ref=e145] [cursor=pointer]
            - row "2 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e146]:
              - cell "2" [ref=e147]
              - cell "Playwright Test Mangal Karyalay" [ref=e148]:
                - strong [ref=e149]: Playwright Test Mangal Karyalay
              - cell "पुणे" [ref=e150]
              - cell "9876543210" [ref=e151]
              - cell "300 व्यक्ती" [ref=e152]
              - cell "₹20,000" [ref=e153]
              - cell "📍 Set" [ref=e154]
              - cell "✏️ Edit 🗑️ Delete" [ref=e155]:
                - generic [ref=e156]:
                  - button "✏️ Edit" [ref=e157] [cursor=pointer]
                  - button "🗑️ Delete" [ref=e158] [cursor=pointer]
            - row "3 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e159]:
              - cell "3" [ref=e160]
              - cell "Playwright Test Mangal Karyalay" [ref=e161]:
                - strong [ref=e162]: Playwright Test Mangal Karyalay
              - cell "पुणे" [ref=e163]
              - cell "9876543210" [ref=e164]
              - cell "300 व्यक्ती" [ref=e165]
              - cell "₹20,000" [ref=e166]
              - cell "📍 Set" [ref=e167]
              - cell "✏️ Edit 🗑️ Delete" [ref=e168]:
                - generic [ref=e169]:
                  - button "✏️ Edit" [ref=e170] [cursor=pointer]
                  - button "🗑️ Delete" [ref=e171] [cursor=pointer]
            - row "4 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e172]:
              - cell "4" [ref=e173]
              - cell "Playwright Test Mangal Karyalay" [ref=e174]:
                - strong [ref=e175]: Playwright Test Mangal Karyalay
              - cell "पुणे" [ref=e176]
              - cell "9876543210" [ref=e177]
              - cell "300 व्यक्ती" [ref=e178]
              - cell "₹20,000" [ref=e179]
              - cell "📍 Set" [ref=e180]
              - cell "✏️ Edit 🗑️ Delete" [ref=e181]:
                - generic [ref=e182]:
                  - button "✏️ Edit" [ref=e183] [cursor=pointer]
                  - button "🗑️ Delete" [ref=e184] [cursor=pointer]
            - row "5 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e185]:
              - cell "5" [ref=e186]
              - cell "Playwright Test Mangal Karyalay" [ref=e187]:
                - strong [ref=e188]: Playwright Test Mangal Karyalay
              - cell "पुणे" [ref=e189]
              - cell "9876543210" [ref=e190]
              - cell "300 व्यक्ती" [ref=e191]
              - cell "₹20,000" [ref=e192]
              - cell "📍 Set" [ref=e193]
              - cell "✏️ Edit 🗑️ Delete" [ref=e194]:
                - generic [ref=e195]:
                  - button "✏️ Edit" [ref=e196] [cursor=pointer]
                  - button "🗑️ Delete" [ref=e197] [cursor=pointer]
            - row "6 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e198]:
              - cell "6" [ref=e199]
              - cell "Playwright Test Mangal Karyalay" [ref=e200]:
                - strong [ref=e201]: Playwright Test Mangal Karyalay
              - cell "पुणे" [ref=e202]
              - cell "9876543210" [ref=e203]
              - cell "300 व्यक्ती" [ref=e204]
              - cell "₹20,000" [ref=e205]
              - cell "📍 Set" [ref=e206]
              - cell "✏️ Edit 🗑️ Delete" [ref=e207]:
                - generic [ref=e208]:
                  - button "✏️ Edit" [ref=e209] [cursor=pointer]
                  - button "🗑️ Delete" [ref=e210] [cursor=pointer]
            - row "7 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e211]:
              - cell "7" [ref=e212]
              - cell "Playwright Test Mangal Karyalay" [ref=e213]:
                - strong [ref=e214]: Playwright Test Mangal Karyalay
              - cell "पुणे" [ref=e215]
              - cell "9876543210" [ref=e216]
              - cell "300 व्यक्ती" [ref=e217]
              - cell "₹20,000" [ref=e218]
              - cell "📍 Set" [ref=e219]
              - cell "✏️ Edit 🗑️ Delete" [ref=e220]:
                - generic [ref=e221]:
                  - button "✏️ Edit" [ref=e222] [cursor=pointer]
                  - button "🗑️ Delete" [ref=e223] [cursor=pointer]
            - row "8 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e224]:
              - cell "8" [ref=e225]
              - cell "Playwright Test Mangal Karyalay" [ref=e226]:
                - strong [ref=e227]: Playwright Test Mangal Karyalay
              - cell "पुणे" [ref=e228]
              - cell "9876543210" [ref=e229]
              - cell "300 व्यक्ती" [ref=e230]
              - cell "₹20,000" [ref=e231]
              - cell "📍 Set" [ref=e232]
              - cell "✏️ Edit 🗑️ Delete" [ref=e233]:
                - generic [ref=e234]:
                  - button "✏️ Edit" [ref=e235] [cursor=pointer]
                  - button "🗑️ Delete" [ref=e236] [cursor=pointer]
            - row "9 सुवर्ण मंगल कार्यालय पुणे 9876543210 500 व्यक्ती ₹25,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e237]:
              - cell "9" [ref=e238]
              - cell "सुवर्ण मंगल कार्यालय" [ref=e239]:
                - strong [ref=e240]: सुवर्ण मंगल कार्यालय
              - cell "पुणे" [ref=e241]
              - cell "9876543210" [ref=e242]
              - cell "500 व्यक्ती" [ref=e243]
              - cell "₹25,000" [ref=e244]
              - cell "📍 Set" [ref=e245]
              - cell "✏️ Edit 🗑️ Delete" [ref=e246]:
                - generic [ref=e247]:
                  - button "✏️ Edit" [ref=e248] [cursor=pointer]
                  - button "🗑️ Delete" [ref=e249] [cursor=pointer]
            - row "10 शुभ विवाह हॉल पुणे 9988776655 300 व्यक्ती ₹18,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e250]:
              - cell "10" [ref=e251]
              - cell "शुभ विवाह हॉल" [ref=e252]:
                - strong [ref=e253]: शुभ विवाह हॉल
              - cell "पुणे" [ref=e254]
              - cell "9988776655" [ref=e255]
              - cell "300 व्यक्ती" [ref=e256]
              - cell "₹18,000" [ref=e257]
              - cell "📍 Set" [ref=e258]
              - cell "✏️ Edit 🗑️ Delete" [ref=e259]:
                - generic [ref=e260]:
                  - button "✏️ Edit" [ref=e261] [cursor=pointer]
                  - button "🗑️ Delete" [ref=e262] [cursor=pointer]
            - row "11 गजानन मंगल कार्यालय पुणे 9123456789 400 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e263]:
              - cell "11" [ref=e264]
              - cell "गजानन मंगल कार्यालय" [ref=e265]:
                - strong [ref=e266]: गजानन मंगल कार्यालय
              - cell "पुणे" [ref=e267]
              - cell "9123456789" [ref=e268]
              - cell "400 व्यक्ती" [ref=e269]
              - cell "₹20,000" [ref=e270]
              - cell "📍 Set" [ref=e271]
              - cell "✏️ Edit 🗑️ Delete" [ref=e272]:
                - generic [ref=e273]:
                  - button "✏️ Edit" [ref=e274] [cursor=pointer]
                  - button "🗑️ Delete" [ref=e275] [cursor=pointer]
```

# Test source

```ts
  315 |     await page.waitForTimeout(3000);
  316 |     const latAfterDistrict = await page.locator('input[name="latitude"]').inputValue();
  317 |     // pick Khed taluka
  318 |     await page.locator('[class*="trigger"]').nth(1).click();
  319 |     await page.locator('[class*="searchInput"]').last().fill('खेड');
  320 |     await page.waitForTimeout(300);
  321 |     await page.locator('[class*="itemLabel"]').filter({ hasText: 'खेड' }).first().click();
  322 |     await page.waitForTimeout(4000);
  323 |     const latAfterTaluka = await page.locator('input[name="latitude"]').inputValue();
  324 |     // lat should change after taluka selection
  325 |     expect(latAfterTaluka).not.toBe('');
  326 |     expect(latAfterDistrict).not.toBe(latAfterTaluka);
  327 |   });
  328 | 
  329 |   test('TC-AH-05: map is visible in form and shows Maharashtra on open', async ({ page }) => {
  330 |     await adminLogin(page);
  331 |     await gotoHalls(page);
  332 |     await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
  333 |     await page.waitForTimeout(1000);
  334 |     await expect(page.locator('.leaflet-container').last()).toBeVisible({ timeout: 8000 });
  335 |   });
  336 | 
  337 |   test('TC-AH-06: clicking map sets lat/lng and shows toast', async ({ page }) => {
  338 |     await adminLogin(page);
  339 |     await gotoHalls(page);
  340 |     await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
  341 |     await page.waitForTimeout(1500);
  342 |     const map = page.locator('.leaflet-container').last();
  343 |     await expect(map).toBeVisible({ timeout: 8000 });
  344 |     // Wait for Leaflet tiles to attach
  345 |     await page.waitForSelector('.leaflet-tile', { state: 'attached', timeout: 10000 }).catch(() => {});
  346 |     await page.waitForTimeout(800);
  347 | 
  348 |     // Access the Leaflet map via React fiber + dispatch click
  349 |     // Leaflet 1.9.x stores _leaflet_id but NOT _leaflet_map on the container.
  350 |     // We simulate the full DOM click event with proper clientX/Y so Leaflet
  351 |     // converts pixel → latlng and fires its internal 'click' event.
  352 |     await page.evaluate(() => {
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
> 415 |     await expect(page.locator(`td:has-text("${TEST_HALL.name}")`)).toBeVisible({ timeout: 8000 });
      |                                                                    ^ Error: expect(locator).toBeVisible() failed
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
  453 |       await hallRow.locator('button:has-text("Delete")').click();
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
```