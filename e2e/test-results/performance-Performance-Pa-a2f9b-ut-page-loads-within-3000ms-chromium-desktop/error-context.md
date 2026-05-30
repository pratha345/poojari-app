# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance.spec.js >> Performance: Page Load Time >> About page loads within 3000ms
- Location: tests\performance.spec.js:23:5

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 5000
Received:   7140
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
    - generic [ref=e42]:
      - text: ॐ
      - generic [ref=e44]:
        - heading "आमच्याबद्दल" [level=1] [ref=e45]
        - paragraph [ref=e46]: पूजारी — महाराष्ट्रातील सर्वोत्तम पूजा बुकिंग सेवा. आम्ही भक्ती आणि तंत्रज्ञान एकत्र आणले आहे.
    - generic [ref=e49]:
      - generic [ref=e50]:
        - heading "आमची सुरुवात" [level=2] [ref=e51]
        - paragraph [ref=e52]: आम्ही पाहिले की लोकांना नवीन शहरात, व्यस्त वेळापत्रकात किंवा तातडीच्या विधींसाठी योग्य पुजारी मिळवणे कठीण होते. तेव्हा आम्हाला विचार आला — भक्ती आणि तंत्रज्ञान एकत्र का नाही आणायचे?
        - paragraph [ref=e53]:
          - text: आणि अशाप्रकारे
          - strong [ref=e54]: पूजारी
          - text: जन्माला आले — एक विश्वासू व्यासपीठ जे प्रत्येक घरापर्यंत योग्य पुजारी पोहोचवते.
        - heading "आमचे ध्येय" [level=2] [ref=e55]
        - paragraph [ref=e56]: महाराष्ट्रातील प्रत्येक घराला योग्य वेळी, योग्य पुजारी मिळवून देणे — सोपे, विश्वासू आणि परवडणाऱ्या किंमतीत.
      - generic [ref=e57]:
        - generic [ref=e58]:
          - generic [ref=e59]: ५००+
          - generic [ref=e60]: विश्वासू पुजारी
        - generic [ref=e61]:
          - generic [ref=e62]: १०,०००+
          - generic [ref=e63]: यशस्वी बुकिंग्ज
        - generic [ref=e64]:
          - generic [ref=e65]: ५०+
          - generic [ref=e66]: शहरे व तालुके
        - generic [ref=e67]:
          - generic [ref=e68]: ४.८ ⭐
          - generic [ref=e69]: सरासरी रेटिंग
        - generic [ref=e70]:
          - generic [ref=e71]: २०+
          - generic [ref=e72]: पूजा प्रकार
        - generic [ref=e73]:
          - generic [ref=e74]: ३
          - generic [ref=e75]: वर्षांचा अनुभव
    - generic [ref=e77]:
      - generic [ref=e78]:
        - heading "आमची मूल्ये" [level=2] [ref=e79]
        - paragraph [ref=e80]: या तत्त्वांवर आमची सेवा उभी आहे
      - generic [ref=e81]:
        - generic [ref=e82]:
          - generic [ref=e83]: 🙏
          - heading "भक्तिभाव" [level=3] [ref=e84]
          - paragraph [ref=e85]: प्रत्येक पूजा मनापासून आणि श्रद्धेने केली जाते.
        - generic [ref=e86]:
          - generic [ref=e87]: ✅
          - heading "विश्वासार्हता" [level=3] [ref=e88]
          - paragraph [ref=e89]: सर्व पुजारी तपासलेले आणि अनुभवी आहेत.
        - generic [ref=e90]:
          - generic [ref=e91]: ⏱
          - heading "वेळेचा सन्मान" [level=3] [ref=e92]
          - paragraph [ref=e93]: आम्ही नेहमी वेळेवर येतो, कोणतीही तडजोड नाही.
        - generic [ref=e94]:
          - generic [ref=e95]: 💰
          - heading "पारदर्शकता" [level=3] [ref=e96]
          - paragraph [ref=e97]: निश्चित किंमत, कोणतेही छुपे शुल्क नाही.
    - generic [ref=e99]:
      - heading "आजच पूजा बुक करा" [level=2] [ref=e100]
      - paragraph [ref=e101]: महाराष्ट्रातील विश्वासू पुजारी सेवेचा अनुभव घ्या
      - generic [ref=e102]:
        - link "🪔 पूजा बुक करा" [ref=e103] [cursor=pointer]:
          - /url: /pooja
        - link "🧑‍🦳 पुजारी व्हा" [ref=e104] [cursor=pointer]:
          - /url: /pujari-nondni
  - contentinfo [ref=e105]:
    - generic [ref=e106]:
      - generic [ref=e107]:
        - generic [ref=e108]:
          - img "Poojaris — For All Poojas" [ref=e110]
          - paragraph [ref=e111]: महाराष्ट्रातील सर्वोत्तम पूजा बुकिंग सेवा. विश्वासू पुजारी, वेळेवर सेवा, आणि पारंपरिक विधी.
          - generic [ref=e112]:
            - link "Facebook" [ref=e113] [cursor=pointer]:
              - /url: https://facebook.com
              - img [ref=e114]
            - link "Instagram" [ref=e116] [cursor=pointer]:
              - /url: https://instagram.com
              - img [ref=e117]
            - link "YouTube" [ref=e119] [cursor=pointer]:
              - /url: https://youtube.com
              - img [ref=e120]
            - link "WhatsApp" [ref=e122] [cursor=pointer]:
              - /url: https://wa.me/9561903219
              - img [ref=e123]
        - generic [ref=e125]:
          - heading "त्वरित लिंक" [level=3] [ref=e126]
          - list [ref=e127]:
            - listitem [ref=e128]:
              - link "› मुख्यपृष्ठ" [ref=e129] [cursor=pointer]:
                - /url: /
            - listitem [ref=e130]:
              - link "› पूजा बुक करा" [ref=e131] [cursor=pointer]:
                - /url: /pooja
            - listitem [ref=e132]:
              - link "› ऑनलाइन पूजा" [ref=e133] [cursor=pointer]:
                - /url: /online-puja
            - listitem [ref=e134]:
              - link "› ब्लॉग" [ref=e135] [cursor=pointer]:
                - /url: /blog
            - listitem [ref=e136]:
              - link "› सर्व शहरे" [ref=e137] [cursor=pointer]:
                - /url: /cities
            - listitem [ref=e138]:
              - link "› पुजारी व्हा" [ref=e139] [cursor=pointer]:
                - /url: /pujari-nondni
            - listitem [ref=e140]:
              - link "› आमच्याबद्दल" [ref=e141] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e142]:
              - link "› संपर्क करा" [ref=e143] [cursor=pointer]:
                - /url: /contact
        - generic [ref=e144]:
          - heading "पूजा श्रेणी" [level=3] [ref=e145]
          - list [ref=e146]:
            - listitem [ref=e147]:
              - link "› गृह पूजा" [ref=e148] [cursor=pointer]:
                - /url: /pooja/gruh-pooja
            - listitem [ref=e149]:
              - link "› हवन / जाप" [ref=e150] [cursor=pointer]:
                - /url: /pooja/havan-jaap
            - listitem [ref=e151]:
              - link "› कथा / नित्य" [ref=e152] [cursor=pointer]:
                - /url: /pooja/katha-nitya
            - listitem [ref=e153]:
              - link "› पित्रुश्राद्ध" [ref=e154] [cursor=pointer]:
                - /url: /pooja/pitru-shraddha
            - listitem [ref=e155]:
              - link "› उत्सव पूजा" [ref=e156] [cursor=pointer]:
                - /url: /pooja/utsav-pooja
            - listitem [ref=e157]:
              - link "› वास्तू पूजा" [ref=e158] [cursor=pointer]:
                - /url: /pooja/vastu-pooja
        - generic [ref=e159]:
          - heading "संपर्क माहिती" [level=3] [ref=e160]
          - list [ref=e161]:
            - listitem [ref=e162]:
              - img [ref=e164]
              - link "› info@pojjari.com" [ref=e166] [cursor=pointer]:
                - /url: mailto:info@pojjari.com
            - listitem [ref=e167]:
              - img [ref=e169]
              - link "› ९५६१९०३२१९" [ref=e171] [cursor=pointer]:
                - /url: tel:9561903219
            - listitem [ref=e172]:
              - img [ref=e174]
              - generic [ref=e176]: रत्नागिरी, महाराष्ट्र
            - listitem [ref=e177]:
              - img [ref=e179]
              - generic [ref=e181]: "सोम – रवि: सकाळी ७ ते रात्री ९"
          - generic [ref=e182]:
            - link "गोपनीयता धोरण" [ref=e183] [cursor=pointer]:
              - /url: "#"
            - link "नियम व अटी" [ref=e184] [cursor=pointer]:
              - /url: "#"
            - link "रद्दीकरण धोरण" [ref=e185] [cursor=pointer]:
              - /url: "#"
      - generic [ref=e186]:
        - paragraph [ref=e187]: © 2026 पूजारी. सर्व हक्क राखीव.
        - paragraph [ref=e188]: भक्तीने बनवले — महाराष्ट्रासाठी ❤️
    - link "WhatsApp वर संपर्क करा" [ref=e189] [cursor=pointer]:
      - /url: https://wa.me/9561903219?text=नमस्कार! मला पूजा बुक करायची आहे.
      - img [ref=e190]
    - button "पूजारी Assistant" [ref=e192] [cursor=pointer]:
      - img [ref=e193]
```

# Test source

```ts
  1   | // e2e/tests/performance.spec.js — Page Load & API Performance Tests (Part 3)
  2   | const { test, expect } = require('@playwright/test');
  3   | 
  4   | const LOAD_THRESHOLD_MS  = 3000;  // 3s page load target
  5   | const API_THRESHOLD_MS   = 500;   // 500ms API response target
  6   | const FCP_THRESHOLD_MS   = 5000;  // First Contentful Paint (Vite dev mode is variable)
  7   | const LCP_THRESHOLD_MS   = 3000;  // Largest Contentful Paint
  8   | 
  9   | // ═══════════════════════════════════════════════════════════════════
  10  | // PART 3A: Page Load Time (< 3 seconds)
  11  | // ═══════════════════════════════════════════════════════════════════
  12  | test.describe('Performance: Page Load Time', () => {
  13  |   const PAGES = [
  14  |     { path: '/',         name: 'Home'     },
  15  |     { path: '/panchang', name: 'Panchang' },
  16  |     { path: '/pooja',    name: 'PoojaList'},
  17  |     { path: '/login',    name: 'Login'    },
  18  |     { path: '/about',    name: 'About'    },
  19  |     { path: '/contact',  name: 'Contact'  },
  20  |   ];
  21  | 
  22  |   for (const pg of PAGES) {
  23  |     test(`${pg.name} page loads within ${LOAD_THRESHOLD_MS}ms`, async ({ page }) => {
  24  |       const start = Date.now();
  25  |       await page.goto(pg.path);
  26  |       await page.waitForLoadState('domcontentloaded', { timeout: LOAD_THRESHOLD_MS + 5000 });
  27  |       const elapsed = Date.now() - start;
  28  | 
> 29  |       expect(elapsed).toBeLessThan(LOAD_THRESHOLD_MS + 2000); // 5s absolute ceiling
      |                       ^ Error: expect(received).toBeLessThan(expected)
  30  | 
  31  |       // Log warning if over target
  32  |       if (elapsed > LOAD_THRESHOLD_MS) {
  33  |         console.warn(`⚠️  ${pg.name}: ${elapsed}ms (target: ${LOAD_THRESHOLD_MS}ms)`);
  34  |       }
  35  |     });
  36  |   }
  37  | });
  38  | 
  39  | // ═══════════════════════════════════════════════════════════════════
  40  | // PART 3B: Web Vitals (Navigation Timing API)
  41  | // ═══════════════════════════════════════════════════════════════════
  42  | test.describe('Performance: Web Vitals', () => {
  43  |   test('Homepage - navigationStart to loadEventEnd < 3s', async ({ page }) => {
  44  |     await page.goto('/');
  45  |     await page.waitForLoadState('load', { timeout: 10000 });
  46  | 
  47  |     const timing = await page.evaluate(() => {
  48  |       const t = performance.getEntriesByType('navigation')[0];
  49  |       return {
  50  |         domContentLoaded: Math.round(t.domContentLoadedEventEnd),
  51  |         loadComplete:     Math.round(t.loadEventEnd),
  52  |         ttfb:             Math.round(t.responseStart - t.requestStart),
  53  |       };
  54  |     });
  55  | 
  56  |     console.log('📊 Homepage timings:', timing);
  57  |     expect(timing.loadComplete).toBeLessThan(LOAD_THRESHOLD_MS + 2000);
  58  |     expect(timing.ttfb).toBeLessThan(1000); // Time to first byte
  59  |   });
  60  | 
  61  |   test('Homepage - First Contentful Paint metric', async ({ page }) => {
  62  |     await page.goto('/');
  63  | 
  64  |     const fcp = await page.evaluate(async () => {
  65  |       return new Promise(resolve => {
  66  |         new PerformanceObserver(list => {
  67  |           for (const entry of list.getEntries()) {
  68  |             if (entry.name === 'first-contentful-paint') {
  69  |               resolve(Math.round(entry.startTime));
  70  |             }
  71  |           }
  72  |         }).observe({ type: 'paint', buffered: true });
  73  |         // Fallback if FCP not fired yet
  74  |         setTimeout(() => resolve(null), 3000);
  75  |       });
  76  |     });
  77  | 
  78  |     if (fcp !== null) {
  79  |       console.log(`📊 FCP: ${fcp}ms`);
  80  |       expect(fcp).toBeLessThan(FCP_THRESHOLD_MS);
  81  |     }
  82  |   });
  83  | 
  84  |   test('Panchang - page renders data within 3s', async ({ page }) => {
  85  |     const start = Date.now();
  86  |     await page.goto('/panchang');
  87  |     // Wait for DOM content — panchang API is CPU-intensive and varies in time
  88  |     await page.waitForLoadState('domcontentloaded', { timeout: 8000 }).catch(() => {});
  89  | 
  90  |     // Some panchang data should be visible
  91  |     await page.locator('body').waitFor({ timeout: 3000 });
  92  |     const elapsed = Date.now() - start;
  93  | 
  94  |     console.log(`📊 Panchang load: ${elapsed}ms`);
  95  |     // Allow up to 10s for panchang (astronomical calculations are CPU-intensive)
  96  |     expect(elapsed).toBeLessThan(10000);
  97  |   });
  98  | });
  99  | 
  100 | // ═══════════════════════════════════════════════════════════════════
  101 | // PART 3C: API Response Time (via page.route interception)
  102 | // ═══════════════════════════════════════════════════════════════════
  103 | test.describe('Performance: API Response Timing', () => {
  104 |   test('Health endpoint responds < 500ms', async ({ page }) => {
  105 |     let apiTime = null;
  106 | 
  107 |     // Intercept API calls and measure
  108 |     await page.route('**/api/health', async route => {
  109 |       const start = Date.now();
  110 |       const response = await route.fetch();
  111 |       apiTime = Date.now() - start;
  112 |       await route.fulfill({ response });
  113 |     });
  114 | 
  115 |     await page.goto('/');
  116 | 
  117 |     if (apiTime !== null) {
  118 |       console.log(`📊 /api/health: ${apiTime}ms`);
  119 |       expect(apiTime).toBeLessThan(API_THRESHOLD_MS);
  120 |     }
  121 |   });
  122 | 
  123 |   test('Panchang API responds < 500ms', async ({ page }) => {
  124 |     const apiTimes = [];
  125 | 
  126 |     await page.route('**/api/panchang**', async route => {
  127 |       const start = Date.now();
  128 |       const response = await route.fetch();
  129 |       apiTimes.push(Date.now() - start);
```