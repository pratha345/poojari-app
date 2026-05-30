# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-flow.spec.js >> User Flow: Authentication Pages >> login form validates empty submission
- Location: tests\user-flow.spec.js:121:3

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('form button[type="submit"]').first()
    - locator resolved to <button type="submit">शोध</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div aria-hidden="true" class="_accentStrip_1vsej_390"></div> intercepts pointer events
  - retrying click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <a href="/login" class="_loginPill_1vsej_282">लॉगिन</a> from <div class="container _navInner_1vsej_17">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div aria-hidden="true" class="_accentStrip_1vsej_390"></div> intercepts pointer events
  2 × retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <main class="_main_1smqu_2">…</main> intercepts pointer events
  3 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <a href="/login" class="_loginPill_1vsej_282">लॉगिन</a> from <div class="container _navInner_1vsej_17">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div aria-hidden="true" class="_accentStrip_1vsej_390"></div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <main class="_main_1smqu_2">…</main> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <main class="_main_1smqu_2">…</main> intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <a href="/login" class="_loginPill_1vsej_282">लॉगिन</a> from <div class="container _navInner_1vsej_17">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - link "Poojaris — For All Poojas" [ref=e7] [cursor=pointer]:
          - /url: /
          - img "Poojaris — For All Poojas" [ref=e8]
        - navigation "मुख्य नेव्हिगेशन" [ref=e9]:
          - link "मुख्यपृष्ठ" [ref=e10] [cursor=pointer]:
            - /url: /
          - button "पूजा सेवा ▾" [ref=e13] [cursor=pointer]:
            - text: पूजा सेवा
            - generic [ref=e14]: ▾
          - button "ज्योतिष ▾" [ref=e17] [cursor=pointer]:
            - text: ज्योतिष
            - generic [ref=e18]: ▾
          - link "ब्लॉग" [ref=e19] [cursor=pointer]:
            - /url: /blog
            - img [ref=e20]
            - text: ब्लॉग
          - link "शहरे" [ref=e22] [cursor=pointer]:
            - /url: /cities
            - img [ref=e23]
            - text: शहरे
          - link "पुजारी व्हा" [ref=e25] [cursor=pointer]:
            - /url: /pujari-nondni
          - link "संपर्क" [ref=e26] [cursor=pointer]:
            - /url: /contact
        - generic [ref=e27]:
          - button "पूजा शोधा" [ref=e28] [cursor=pointer]:
            - img [ref=e29]
          - button "EN ▾" [ref=e31] [cursor=pointer]:
            - text: EN
            - generic [ref=e32]: ▾
          - link "🪔 पूजा बुक करा" [ref=e33] [cursor=pointer]:
            - /url: /pooja
          - link "लॉगिन" [ref=e34] [cursor=pointer]:
            - /url: /login
      - generic [ref=e37]:
        - textbox "पूजा शोधा" [ref=e38]:
          - /placeholder: पूजा शोधा...
        - button "शोध" [ref=e39] [cursor=pointer]
  - main [ref=e41]:
    - text: ॐ
    - generic [ref=e42]:
      - generic [ref=e43]:
        - generic [ref=e44]: 🪔
        - heading "लॉगिन करा" [level=1] [ref=e45]
        - paragraph [ref=e46]: आपल्या खात्यात प्रवेश करा
      - generic [ref=e47]:
        - button "पासवर्ड" [ref=e48] [cursor=pointer]
        - button "OTP लॉगिन" [ref=e49] [cursor=pointer]
      - generic [ref=e50]:
        - generic [ref=e51]:
          - generic [ref=e52]: फोन नंबर किंवा ईमेल *
          - 'textbox "उदा: 9561903219 किंवा email@example.com" [ref=e53]'
        - generic [ref=e54]:
          - generic [ref=e55]: पासवर्ड *
          - textbox "आपला पासवर्ड टाका" [ref=e56]
        - button "🙏 लॉगिन करा" [ref=e57] [cursor=pointer]
        - link "🔑 पासवर्ड विसरलात?" [ref=e59] [cursor=pointer]:
          - /url: /forgot-password
      - generic [ref=e60]: किंवा
      - paragraph [ref=e61]:
        - text: खाते नाही?
        - link "येथे नोंदणी करा" [ref=e62] [cursor=pointer]:
          - /url: /register
      - paragraph [ref=e63]:
        - text: पुजारी म्हणून नोंदणी करायची आहे?
        - link "पुजारी व्हा" [ref=e64] [cursor=pointer]:
          - /url: /pujari-nondni
  - contentinfo [ref=e65]:
    - generic [ref=e66]:
      - generic [ref=e67]:
        - generic [ref=e68]:
          - img "Poojaris — For All Poojas" [ref=e70]
          - paragraph [ref=e71]: महाराष्ट्रातील सर्वोत्तम पूजा बुकिंग सेवा. विश्वासू पुजारी, वेळेवर सेवा, आणि पारंपरिक विधी.
          - generic [ref=e72]:
            - link "Facebook" [ref=e73] [cursor=pointer]:
              - /url: https://facebook.com
              - img [ref=e74]
            - link "Instagram" [ref=e76] [cursor=pointer]:
              - /url: https://instagram.com
              - img [ref=e77]
            - link "YouTube" [ref=e79] [cursor=pointer]:
              - /url: https://youtube.com
              - img [ref=e80]
            - link "WhatsApp" [ref=e82] [cursor=pointer]:
              - /url: https://wa.me/9561903219
              - img [ref=e83]
        - generic [ref=e85]:
          - heading "त्वरित लिंक" [level=3] [ref=e86]
          - list [ref=e87]:
            - listitem [ref=e88]:
              - link "› मुख्यपृष्ठ" [ref=e89] [cursor=pointer]:
                - /url: /
            - listitem [ref=e90]:
              - link "› पूजा बुक करा" [ref=e91] [cursor=pointer]:
                - /url: /pooja
            - listitem [ref=e92]:
              - link "› ऑनलाइन पूजा" [ref=e93] [cursor=pointer]:
                - /url: /online-puja
            - listitem [ref=e94]:
              - link "› ब्लॉग" [ref=e95] [cursor=pointer]:
                - /url: /blog
            - listitem [ref=e96]:
              - link "› सर्व शहरे" [ref=e97] [cursor=pointer]:
                - /url: /cities
            - listitem [ref=e98]:
              - link "› पुजारी व्हा" [ref=e99] [cursor=pointer]:
                - /url: /pujari-nondni
            - listitem [ref=e100]:
              - link "› आमच्याबद्दल" [ref=e101] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e102]:
              - link "› संपर्क करा" [ref=e103] [cursor=pointer]:
                - /url: /contact
        - generic [ref=e104]:
          - heading "पूजा श्रेणी" [level=3] [ref=e105]
          - list [ref=e106]:
            - listitem [ref=e107]:
              - link "› गृह पूजा" [ref=e108] [cursor=pointer]:
                - /url: /pooja/gruh-pooja
            - listitem [ref=e109]:
              - link "› हवन / जाप" [ref=e110] [cursor=pointer]:
                - /url: /pooja/havan-jaap
            - listitem [ref=e111]:
              - link "› कथा / नित्य" [ref=e112] [cursor=pointer]:
                - /url: /pooja/katha-nitya
            - listitem [ref=e113]:
              - link "› पित्रुश्राद्ध" [ref=e114] [cursor=pointer]:
                - /url: /pooja/pitru-shraddha
            - listitem [ref=e115]:
              - link "› उत्सव पूजा" [ref=e116] [cursor=pointer]:
                - /url: /pooja/utsav-pooja
            - listitem [ref=e117]:
              - link "› वास्तू पूजा" [ref=e118] [cursor=pointer]:
                - /url: /pooja/vastu-pooja
        - generic [ref=e119]:
          - heading "संपर्क माहिती" [level=3] [ref=e120]
          - list [ref=e121]:
            - listitem [ref=e122]:
              - img [ref=e124]
              - link "› info@pojjari.com" [ref=e126] [cursor=pointer]:
                - /url: mailto:info@pojjari.com
            - listitem [ref=e127]:
              - img [ref=e129]
              - link "› ९५६१९०३२१९" [ref=e131] [cursor=pointer]:
                - /url: tel:9561903219
            - listitem [ref=e132]:
              - img [ref=e134]
              - generic [ref=e136]: रत्नागिरी, महाराष्ट्र
            - listitem [ref=e137]:
              - img [ref=e139]
              - generic [ref=e141]: "सोम – रवि: सकाळी ७ ते रात्री ९"
          - generic [ref=e142]:
            - link "गोपनीयता धोरण" [ref=e143] [cursor=pointer]:
              - /url: "#"
            - link "नियम व अटी" [ref=e144] [cursor=pointer]:
              - /url: "#"
            - link "रद्दीकरण धोरण" [ref=e145] [cursor=pointer]:
              - /url: "#"
      - generic [ref=e146]:
        - paragraph [ref=e147]: © 2026 पूजारी. सर्व हक्क राखीव.
        - paragraph [ref=e148]: भक्तीने बनवले — महाराष्ट्रासाठी ❤️
    - link "WhatsApp वर संपर्क करा" [ref=e149] [cursor=pointer]:
      - /url: https://wa.me/9561903219?text=नमस्कार! मला पूजा बुक करायची आहे.
      - img [ref=e150]
    - button "पूजारी Assistant" [ref=e152] [cursor=pointer]:
      - img [ref=e153]
```

# Test source

```ts
  28  |   });
  29  | 
  30  |   test('homepage has navigation links', async ({ page }) => {
  31  |     await page.goto('/');
  32  |     await waitForPageLoad(page);
  33  | 
  34  |     // Nav links should exist
  35  |     const nav = page.locator('nav, header').first();
  36  |     await expect(nav).toBeVisible();
  37  |   });
  38  | 
  39  |   test('clicking "पंचांग पहा" navigates to panchang page', async ({ page }) => {
  40  |     await page.goto('/');
  41  |     await waitForPageLoad(page);
  42  | 
  43  |     const panchaangLink = page.locator('a[href*="panchang"]').first();
  44  |     if (await panchaangLink.count() > 0) {
  45  |       await panchaangLink.click();
  46  |       await page.waitForURL('**/panchang**', { timeout: 5000 });
  47  |       expect(page.url()).toContain('panchang');
  48  |     } else {
  49  |       // Navigate directly
  50  |       await page.goto('/panchang');
  51  |       expect(page.url()).toContain('panchang');
  52  |     }
  53  |   });
  54  | 
  55  |   test('footer is visible on homepage', async ({ page }) => {
  56  |     await page.goto('/');
  57  |     await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  58  |     const footer = page.locator('footer').first();
  59  |     await expect(footer).toBeVisible({ timeout: 5000 });
  60  |   });
  61  | });
  62  | 
  63  | test.describe('User Flow: Panchang Page', () => {
  64  |   test('panchang page loads and shows date', async ({ page }) => {
  65  |     await page.goto('/panchang');
  66  |     await waitForPageLoad(page);
  67  | 
  68  |     const heading = page.locator('h1, h2').first();
  69  |     await expect(heading).toBeVisible({ timeout: 5000 });
  70  |   });
  71  | 
  72  |   test('panchang shows today\'s data by default', async ({ page }) => {
  73  |     await page.goto('/panchang');
  74  |     await waitForPageLoad(page);
  75  | 
  76  |     const today = new Date().toLocaleDateString('en-IN');
  77  |     const pageText = await page.locator('body').textContent();
  78  |     // Page must have some content
  79  |     expect(pageText.length).toBeGreaterThan(50);
  80  |   });
  81  | });
  82  | 
  83  | test.describe('User Flow: Pooja Listing', () => {
  84  |   test('pooja list page loads', async ({ page }) => {
  85  |     await page.goto('/pooja');
  86  |     await waitForPageLoad(page);
  87  |     await expect(page.locator('body')).toBeVisible();
  88  |     const text = await page.locator('body').textContent();
  89  |     expect(text.length).toBeGreaterThan(50);
  90  |   });
  91  | 
  92  |   test('navigating to about page works', async ({ page }) => {
  93  |     await page.goto('/about');
  94  |     // Wait for a specific element rather than networkidle (Vite HMR WebSocket prevents networkidle)
  95  |     const heading = page.locator('h1, h2').first();
  96  |     await expect(heading).toBeVisible({ timeout: 10000 });
  97  |   });
  98  | 
  99  |   test('contact page loads', async ({ page }) => {
  100 |     await page.goto('/contact');
  101 |     await waitForPageLoad(page);
  102 |     await expect(page.locator('body')).toBeVisible();
  103 |   });
  104 | });
  105 | 
  106 | test.describe('User Flow: Authentication Pages', () => {
  107 |   test('login page renders correctly', async ({ page }) => {
  108 |     await page.goto('/login');
  109 |     await waitForPageLoad(page);
  110 | 
  111 |     await expect(page.locator('input[type="tel"], input[name="phone"]').first()).toBeVisible({ timeout: 5000 });
  112 |     await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 5000 });
  113 |   });
  114 | 
  115 |   test('register page renders correctly', async ({ page }) => {
  116 |     await page.goto('/register');
  117 |     await waitForPageLoad(page);
  118 |     await expect(page.locator('form').first()).toBeVisible({ timeout: 5000 });
  119 |   });
  120 | 
  121 |   test('login form validates empty submission', async ({ page }) => {
  122 |     await page.goto('/login');
  123 |     await waitForPageLoad(page);
  124 | 
  125 |     // Use form-scoped selector to avoid matching header search button
  126 |     const submitBtn = page.locator('form button[type="submit"]').first();
  127 |     if (await submitBtn.count() > 0) {
> 128 |       await submitBtn.click();
      |                       ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  129 |       // Should show validation feedback or stay on the same page
  130 |       await expect(page).toHaveURL(/login/);
  131 |     }
  132 |   });
  133 | 
  134 |   test('protected route /my-bookings redirects unauthenticated user', async ({ page }) => {
  135 |     await page.goto('/my-bookings');
  136 |     await waitForPageLoad(page);
  137 |     // Should redirect to login or home
  138 |     const url = page.url();
  139 |     expect(url).not.toContain('my-bookings');
  140 |   });
  141 | 
  142 |   test('protected route /admin redirects non-admin user', async ({ page }) => {
  143 |     await page.goto('/admin');
  144 |     await waitForPageLoad(page);
  145 |     const url = page.url();
  146 |     // Either redirects to login or shows admin login
  147 |     expect(url.includes('login') || url.includes('admin')).toBeTruthy();
  148 |   });
  149 | });
  150 | 
  151 | test.describe('User Flow: 404 & Error Pages', () => {
  152 |   test('unknown route redirects to home', async ({ page }) => {
  153 |     await page.goto('/this-page-does-not-exist-at-all');
  154 |     await waitForPageLoad(page);
  155 |     // App's wildcard route redirects to /
  156 |     expect(page.url()).toMatch(/localhost:5173\/?$/);
  157 |   });
  158 | });
  159 | 
  160 | // ═══════════════════════════════════════════════════════════════════
  161 | // PART 5 (continued): Stress — Parallel Page Loads
  162 | // ═══════════════════════════════════════════════════════════════════
  163 | test.describe('Stress: Multiple Simultaneous Loads @stress', () => {
  164 |   test('5 homepage loads in sequence complete without errors', async ({ page }) => {
  165 |     for (let i = 0; i < 5; i++) {
  166 |       await page.goto('/');
  167 |       await waitForPageLoad(page);
  168 |       const h1 = page.locator('h1').first();
  169 |       await expect(h1).toBeVisible({ timeout: 5000 });
  170 |     }
  171 |   });
  172 | 
  173 |   test('rapid navigation between pages does not crash', async ({ page }) => {
  174 |     const pages = ['/', '/panchang', '/pooja', '/about', '/contact', '/login'];
  175 |     for (const path of pages) {
  176 |       await page.goto(path);
  177 |       await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
  178 |       // No error page / no crash
  179 |       const body = page.locator('body');
  180 |       await expect(body).toBeVisible();
  181 |     }
  182 |   });
  183 | });
  184 | 
```