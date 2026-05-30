# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hall-booking.spec.js >> Admin Manage Halls — District/Taluka + Map >> TC-AH-04: selecting taluka in form refines geocoding
- Location: tests\hall-booking.spec.js:305:3

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('button:has-text("नवीन हॉल जोडा")').first()
    - locator resolved to <button class="_addBtn_qnteh_6">+ नवीन हॉल जोडा</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="_header_qnteh_3">…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="_header_qnteh_3">…</div> intercepts pointer events
    - retrying click action
      - waiting 100ms
    2 × waiting for element to be visible, enabled and stable
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
      - <div class="_header_qnteh_3">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="_header_qnteh_3">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms

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
      - heading "Manage Halls" [level=2] [ref=e81]
      - generic [ref=e83]:
        - img [ref=e84]
        - text: Test Admin
    - generic [ref=e87]:
      - generic [ref=e88]:
        - heading "🏛️ Hall Management" [level=2] [ref=e89]
        - button "+ नवीन हॉल जोडा" [ref=e90] [cursor=pointer]
      - table [ref=e92]:
        - rowgroup [ref=e93]:
          - row "# नाव जिल्हा / तालुका फोन क्षमता भाडे/दिवस Location Actions" [ref=e94]:
            - columnheader "#" [ref=e95]
            - columnheader "नाव" [ref=e96]
            - columnheader "जिल्हा / तालुका" [ref=e97]
            - columnheader "फोन" [ref=e98]
            - columnheader "क्षमता" [ref=e99]
            - columnheader "भाडे/दिवस" [ref=e100]
            - columnheader "Location" [ref=e101]
            - columnheader "Actions" [ref=e102]
        - rowgroup [ref=e103]:
          - row "1 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e104]:
            - cell "1" [ref=e105]
            - cell "Playwright Test Mangal Karyalay" [ref=e106]:
              - strong [ref=e107]: Playwright Test Mangal Karyalay
            - cell "पुणे" [ref=e108]
            - cell "9876543210" [ref=e109]
            - cell "300 व्यक्ती" [ref=e110]
            - cell "₹20,000" [ref=e111]
            - cell "📍 Set" [ref=e112]
            - cell "✏️ Edit 🗑️ Delete" [ref=e113]:
              - generic [ref=e114]:
                - button "✏️ Edit" [ref=e115] [cursor=pointer]
                - button "🗑️ Delete" [ref=e116] [cursor=pointer]
          - row "2 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e117]:
            - cell "2" [ref=e118]
            - cell "Playwright Test Mangal Karyalay" [ref=e119]:
              - strong [ref=e120]: Playwright Test Mangal Karyalay
            - cell "पुणे" [ref=e121]
            - cell "9876543210" [ref=e122]
            - cell "300 व्यक्ती" [ref=e123]
            - cell "₹20,000" [ref=e124]
            - cell "📍 Set" [ref=e125]
            - cell "✏️ Edit 🗑️ Delete" [ref=e126]:
              - generic [ref=e127]:
                - button "✏️ Edit" [ref=e128] [cursor=pointer]
                - button "🗑️ Delete" [ref=e129] [cursor=pointer]
          - row "3 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e130]:
            - cell "3" [ref=e131]
            - cell "Playwright Test Mangal Karyalay" [ref=e132]:
              - strong [ref=e133]: Playwright Test Mangal Karyalay
            - cell "पुणे" [ref=e134]
            - cell "9876543210" [ref=e135]
            - cell "300 व्यक्ती" [ref=e136]
            - cell "₹20,000" [ref=e137]
            - cell "📍 Set" [ref=e138]
            - cell "✏️ Edit 🗑️ Delete" [ref=e139]:
              - generic [ref=e140]:
                - button "✏️ Edit" [ref=e141] [cursor=pointer]
                - button "🗑️ Delete" [ref=e142] [cursor=pointer]
          - row "4 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e143]:
            - cell "4" [ref=e144]
            - cell "Playwright Test Mangal Karyalay" [ref=e145]:
              - strong [ref=e146]: Playwright Test Mangal Karyalay
            - cell "पुणे" [ref=e147]
            - cell "9876543210" [ref=e148]
            - cell "300 व्यक्ती" [ref=e149]
            - cell "₹20,000" [ref=e150]
            - cell "📍 Set" [ref=e151]
            - cell "✏️ Edit 🗑️ Delete" [ref=e152]:
              - generic [ref=e153]:
                - button "✏️ Edit" [ref=e154] [cursor=pointer]
                - button "🗑️ Delete" [ref=e155] [cursor=pointer]
          - row "5 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e156]:
            - cell "5" [ref=e157]
            - cell "Playwright Test Mangal Karyalay" [ref=e158]:
              - strong [ref=e159]: Playwright Test Mangal Karyalay
            - cell "पुणे" [ref=e160]
            - cell "9876543210" [ref=e161]
            - cell "300 व्यक्ती" [ref=e162]
            - cell "₹20,000" [ref=e163]
            - cell "📍 Set" [ref=e164]
            - cell "✏️ Edit 🗑️ Delete" [ref=e165]:
              - generic [ref=e166]:
                - button "✏️ Edit" [ref=e167] [cursor=pointer]
                - button "🗑️ Delete" [ref=e168] [cursor=pointer]
          - row "6 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e169]:
            - cell "6" [ref=e170]
            - cell "Playwright Test Mangal Karyalay" [ref=e171]:
              - strong [ref=e172]: Playwright Test Mangal Karyalay
            - cell "पुणे" [ref=e173]
            - cell "9876543210" [ref=e174]
            - cell "300 व्यक्ती" [ref=e175]
            - cell "₹20,000" [ref=e176]
            - cell "📍 Set" [ref=e177]
            - cell "✏️ Edit 🗑️ Delete" [ref=e178]:
              - generic [ref=e179]:
                - button "✏️ Edit" [ref=e180] [cursor=pointer]
                - button "🗑️ Delete" [ref=e181] [cursor=pointer]
          - row "7 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e182]:
            - cell "7" [ref=e183]
            - cell "Playwright Test Mangal Karyalay" [ref=e184]:
              - strong [ref=e185]: Playwright Test Mangal Karyalay
            - cell "पुणे" [ref=e186]
            - cell "9876543210" [ref=e187]
            - cell "300 व्यक्ती" [ref=e188]
            - cell "₹20,000" [ref=e189]
            - cell "📍 Set" [ref=e190]
            - cell "✏️ Edit 🗑️ Delete" [ref=e191]:
              - generic [ref=e192]:
                - button "✏️ Edit" [ref=e193] [cursor=pointer]
                - button "🗑️ Delete" [ref=e194] [cursor=pointer]
          - row "8 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e195]:
            - cell "8" [ref=e196]
            - cell "Playwright Test Mangal Karyalay" [ref=e197]:
              - strong [ref=e198]: Playwright Test Mangal Karyalay
            - cell "पुणे" [ref=e199]
            - cell "9876543210" [ref=e200]
            - cell "300 व्यक्ती" [ref=e201]
            - cell "₹20,000" [ref=e202]
            - cell "📍 Set" [ref=e203]
            - cell "✏️ Edit 🗑️ Delete" [ref=e204]:
              - generic [ref=e205]:
                - button "✏️ Edit" [ref=e206] [cursor=pointer]
                - button "🗑️ Delete" [ref=e207] [cursor=pointer]
          - row "9 Playwright Test Mangal Karyalay पुणे 9876543210 300 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e208]:
            - cell "9" [ref=e209]
            - cell "Playwright Test Mangal Karyalay" [ref=e210]:
              - strong [ref=e211]: Playwright Test Mangal Karyalay
            - cell "पुणे" [ref=e212]
            - cell "9876543210" [ref=e213]
            - cell "300 व्यक्ती" [ref=e214]
            - cell "₹20,000" [ref=e215]
            - cell "📍 Set" [ref=e216]
            - cell "✏️ Edit 🗑️ Delete" [ref=e217]:
              - generic [ref=e218]:
                - button "✏️ Edit" [ref=e219] [cursor=pointer]
                - button "🗑️ Delete" [ref=e220] [cursor=pointer]
          - row "10 सुवर्ण मंगल कार्यालय पुणे 9876543210 500 व्यक्ती ₹25,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e221]:
            - cell "10" [ref=e222]
            - cell "सुवर्ण मंगल कार्यालय" [ref=e223]:
              - strong [ref=e224]: सुवर्ण मंगल कार्यालय
            - cell "पुणे" [ref=e225]
            - cell "9876543210" [ref=e226]
            - cell "500 व्यक्ती" [ref=e227]
            - cell "₹25,000" [ref=e228]
            - cell "📍 Set" [ref=e229]
            - cell "✏️ Edit 🗑️ Delete" [ref=e230]:
              - generic [ref=e231]:
                - button "✏️ Edit" [ref=e232] [cursor=pointer]
                - button "🗑️ Delete" [ref=e233] [cursor=pointer]
          - row "11 शुभ विवाह हॉल पुणे 9988776655 300 व्यक्ती ₹18,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e234]:
            - cell "11" [ref=e235]
            - cell "शुभ विवाह हॉल" [ref=e236]:
              - strong [ref=e237]: शुभ विवाह हॉल
            - cell "पुणे" [ref=e238]
            - cell "9988776655" [ref=e239]
            - cell "300 व्यक्ती" [ref=e240]
            - cell "₹18,000" [ref=e241]
            - cell "📍 Set" [ref=e242]
            - cell "✏️ Edit 🗑️ Delete" [ref=e243]:
              - generic [ref=e244]:
                - button "✏️ Edit" [ref=e245] [cursor=pointer]
                - button "🗑️ Delete" [ref=e246] [cursor=pointer]
          - row "12 गजानन मंगल कार्यालय पुणे 9123456789 400 व्यक्ती ₹20,000 📍 Set ✏️ Edit 🗑️ Delete" [ref=e247]:
            - cell "12" [ref=e248]
            - cell "गजानन मंगल कार्यालय" [ref=e249]:
              - strong [ref=e250]: गजानन मंगल कार्यालय
            - cell "पुणे" [ref=e251]
            - cell "9123456789" [ref=e252]
            - cell "400 व्यक्ती" [ref=e253]
            - cell "₹20,000" [ref=e254]
            - cell "📍 Set" [ref=e255]
            - cell "✏️ Edit 🗑️ Delete" [ref=e256]:
              - generic [ref=e257]:
                - button "✏️ Edit" [ref=e258] [cursor=pointer]
                - button "🗑️ Delete" [ref=e259] [cursor=pointer]
```

# Test source

```ts
  208 |     await page.goto('/hall-booking');
  209 |     await waitForLoad(page);
  210 |     await page.locator('[class*="trigger"]').first().click();
  211 |     await page.locator('[class*="searchInput"]').first().fill('pune');
  212 |     await page.waitForTimeout(300);
  213 |     await page.locator('[class*="itemLabel"]').filter({ hasText: /^पुणे$/ }).first().click();
  214 |     await page.waitForTimeout(300);
  215 |     // Click the ✕ clear icon inside the trigger
  216 |     const clearIcon = page.locator('[class*="clearIcon"]').first();
  217 |     await expect(clearIcon).toBeVisible();
  218 |     await clearIcon.click();
  219 |     await expect(page.locator('[class*="trigger"]').first()).toContainText('जिल्हा निवडा');
  220 |   });
  221 | 
  222 |   test('TC-HB-15: hall card shows district › taluka badge', async ({ page }) => {
  223 |     await page.goto('/hall-booking');
  224 |     await waitForLoad(page);
  225 |     // if any halls have district set, their badge shows "district › taluka"
  226 |     const badges = page.locator('[class*="cityBadge"]');
  227 |     const count  = await badges.count();
  228 |     if (count > 0) {
  229 |       const text = await badges.first().innerText();
  230 |       expect(text).toMatch(/📍/);
  231 |     }
  232 |   });
  233 | 
  234 |   test('TC-HB-16: typing non-existent district shows no result message', async ({ page }) => {
  235 |     await page.goto('/hall-booking');
  236 |     await waitForLoad(page);
  237 |     await page.locator('[class*="trigger"]').first().click();
  238 |     await page.locator('[class*="searchInput"]').first().fill('xyz123notadistrict');
  239 |     await page.waitForTimeout(300);
  240 |     const noResult = page.locator('[class*="noResult"]');
  241 |     await expect(noResult).toBeVisible({ timeout: 3000 });
  242 |     await expect(noResult).toContainText('सापडले नाही');
  243 |   });
  244 | 
  245 |   test('TC-HB-17: breadcrumb shows correct navigation', async ({ page }) => {
  246 |     await page.goto('/hall-booking');
  247 |     await waitForLoad(page);
  248 |     const breadcrumb = page.locator('[class*="breadcrumb"]');
  249 |     await expect(breadcrumb).toContainText('मुख्यपृष्ठ');
  250 |     await expect(breadcrumb).toContainText('हॉल बुकिंग');
  251 |   });
  252 | 
  253 |   test('TC-HB-18: map/list toggle visible when halls exist', async ({ page }) => {
  254 |     await page.goto('/hall-booking');
  255 |     await waitForLoad(page);
  256 |     const listBtn = page.locator('button:has-text("यादी")');
  257 |     if (await listBtn.count() > 0) {
  258 |       await expect(listBtn).toBeVisible();
  259 |       await expect(page.locator('button:has-text("नकाशा")')).toBeVisible();
  260 |     }
  261 |   });
  262 | });
  263 | 
  264 | // ═══════════════════════════════════════════════════════════════════
  265 | // SECTION 2 — Admin Manage Halls (District/Taluka + Map)
  266 | // ═══════════════════════════════════════════════════════════════════
  267 | 
  268 | test.describe('Admin Manage Halls — District/Taluka + Map', () => {
  269 | 
  270 |   test('TC-AH-01: Manage Halls page loads for admin', async ({ page }) => {
  271 |     await adminLogin(page);
  272 |     await gotoHalls(page);
  273 |     await expect(page.locator('[class*="title"]').first()).toContainText(/Hall|हॉल/i);
  274 |   });
  275 | 
  276 |   test('TC-AH-02: add form has district SearchableSelect', async ({ page }) => {
  277 |     await adminLogin(page);
  278 |     await gotoHalls(page);
  279 |     await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
  280 |     await page.waitForTimeout(600);
  281 |     // district trigger should be visible with placeholder
  282 |     const triggers = page.locator('[class*="trigger"]');
  283 |     await expect(triggers.first()).toBeVisible({ timeout: 5000 });
  284 |     await expect(triggers.first()).toContainText('जिल्हा निवडा');
  285 |   });
  286 | 
  287 |   test('TC-AH-03: selecting district in form auto-geocodes and fills lat/lng', async ({ page }) => {
  288 |     await adminLogin(page);
  289 |     await gotoHalls(page);
  290 |     await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
  291 |     await page.waitForTimeout(600);
  292 |     // pick Nashik
  293 |     await page.locator('[class*="trigger"]').first().click();
  294 |     await page.locator('[class*="searchInput"]').first().fill('nashik');
  295 |     await page.waitForTimeout(300);
  296 |     await page.locator('[class*="itemLabel"]').filter({ hasText: 'नाशिक' }).first().click();
  297 |     // wait for geocoding
  298 |     await page.waitForTimeout(4000);
  299 |     const lat = await page.locator('input[name="latitude"]').inputValue();
  300 |     const lng = await page.locator('input[name="longitude"]').inputValue();
  301 |     expect(parseFloat(lat)).toBeGreaterThan(0);
  302 |     expect(parseFloat(lng)).toBeGreaterThan(0);
  303 |   });
  304 | 
  305 |   test('TC-AH-04: selecting taluka in form refines geocoding', async ({ page }) => {
  306 |     await adminLogin(page);
  307 |     await gotoHalls(page);
> 308 |     await page.locator('button:has-text("नवीन हॉल जोडा")').first().click();
      |                                                                    ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  309 |     await page.waitForTimeout(600);
  310 |     // pick Ratnagiri district
  311 |     await page.locator('[class*="trigger"]').first().click();
  312 |     await page.locator('[class*="searchInput"]').first().fill('rtn');
  313 |     await page.waitForTimeout(300);
  314 |     await page.locator('[class*="itemLabel"]').filter({ hasText: 'रत्नागिरी' }).first().click();
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
```