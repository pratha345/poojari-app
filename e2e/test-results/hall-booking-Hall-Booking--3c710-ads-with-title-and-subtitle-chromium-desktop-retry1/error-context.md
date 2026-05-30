# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hall-booking.spec.js >> Hall Booking — Customer Search >> TC-HB-01: page loads with title and subtitle
- Location: tests\hall-booking.spec.js:55:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[class*="pageSubtitle"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[class*="pageSubtitle"]')

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
    - generic [ref=e43]:
      - link "मुख्यपृष्ठ" [ref=e44] [cursor=pointer]:
        - /url: /
      - generic [ref=e45]: ›
      - generic [ref=e46]: हॉल बुकिंग
    - generic [ref=e47]:
      - generic [ref=e48]:
        - generic [ref=e49]:
          - generic [ref=e50]: ✨ फक्त पूजारीवर उपलब्ध
          - heading "🏛️ महाराष्ट्रातील सर्वोत्तम हॉल बुकिंग सेवा" [level=1] [ref=e51]:
            - text: 🏛️ महाराष्ट्रातील सर्वोत्तम
            - text: हॉल बुकिंग सेवा
          - paragraph [ref=e52]:
            - text: लग्न · साखरपुडा · वाढदिवस · सत्यनारायण पूजा · समारंभ
            - text: हॉल बुकिंग
            - strong [ref=e53]: +
            - text: पुजारी बुकिंग — एकाच ठिकाणी!
          - generic [ref=e54]:
            - generic [ref=e55]:
              - generic [ref=e56]: ३६
              - generic [ref=e57]: जिल्हे
            - generic [ref=e59]:
              - generic [ref=e60]: 📍 GPS
              - generic [ref=e61]: जवळचे शोधा
            - generic [ref=e63]:
              - generic [ref=e64]: 🗺️
              - generic [ref=e65]: Map दृश्य
            - generic [ref=e67]:
              - generic [ref=e68]: निःशुल्क
              - generic [ref=e69]: बुकिंग
        - generic [ref=e71]:
          - generic [ref=e72]:
            - generic [ref=e73]: ✅
            - generic [ref=e74]: GPS वापरून जवळचे हॉल
          - generic [ref=e75]:
            - generic [ref=e76]: ✅
            - generic [ref=e77]: OpenStreetMap + DB एकत्र
          - generic [ref=e78]:
            - generic [ref=e79]: ✅
            - generic [ref=e80]: पुजारी + हॉल एकत्र बुक करा
          - generic [ref=e81]:
            - generic [ref=e82]: ✅
            - generic [ref=e83]: महाराष्ट्रातील सर्व ३६ जिल्हे
          - generic [ref=e84]:
            - generic [ref=e85]: 🔴
            - generic [ref=e86]:
              - text: PanditsNearMe — हॉल बुकिंग
              - strong [ref=e87]: नाही
          - generic [ref=e88]:
            - generic [ref=e89]: 🟢
            - generic [ref=e90]:
              - text: पूजारी — हॉल + पुजारी
              - strong [ref=e91]: दोन्ही
              - text: "!"
      - generic [ref=e92]:
        - button "🏙️ जिल्हा निवडा... ▼" [ref=e95] [cursor=pointer]:
          - generic [ref=e96]: 🏙️ जिल्हा निवडा...
          - generic [ref=e98]: ▼
        - generic [ref=e99]:
          - generic:
            - button "🏘️ तालुका निवडा (ऐच्छिक) ▼" [disabled]:
              - generic: 🏘️ तालुका निवडा (ऐच्छिक)
              - generic:
                - generic: ▼
        - button "🔍 शोधा" [disabled] [ref=e100]
        - button "📍 जवळचे" [ref=e101] [cursor=pointer]
      - generic [ref=e103]: 🏛️ सर्व हॉल
      - generic [ref=e104]:
        - button "☰ यादी" [ref=e105] [cursor=pointer]
        - button "🗺️ नकाशा" [ref=e106] [cursor=pointer]
      - paragraph [ref=e107]: 10 हॉल उपलब्ध आहेत
      - generic [ref=e108]:
        - generic [ref=e109]:
          - generic [ref=e110]:
            - heading "🏛️ Playwright Test Mangal Karyalay" [level=2] [ref=e111]
            - generic [ref=e113]: 📍 पुणे
          - generic [ref=e114]:
            - paragraph [ref=e115]:
              - generic [ref=e116]: 🗺️
              - generic [ref=e117]: 123 Test Nagar, Shivajinagar
            - paragraph [ref=e118]:
              - generic [ref=e119]: 👥
              - generic [ref=e120]:
                - strong [ref=e121]: "क्षमता:"
                - text: 300 व्यक्ती
            - paragraph [ref=e122]:
              - generic [ref=e123]: 💰
              - generic [ref=e124]:
                - strong [ref=e125]: "भाडे:"
                - text: ₹20,000 / दिवस
          - generic [ref=e126]:
            - link "📞 कॉल करा" [ref=e127] [cursor=pointer]:
              - /url: tel:9876543210
            - link "💬 WhatsApp" [ref=e128] [cursor=pointer]:
              - /url: https://wa.me/919876543210
        - generic [ref=e129]:
          - generic [ref=e130]:
            - heading "🏛️ Playwright Test Mangal Karyalay" [level=2] [ref=e131]
            - generic [ref=e133]: 📍 पुणे
          - generic [ref=e134]:
            - paragraph [ref=e135]:
              - generic [ref=e136]: 🗺️
              - generic [ref=e137]: 123 Test Nagar, Shivajinagar
            - paragraph [ref=e138]:
              - generic [ref=e139]: 👥
              - generic [ref=e140]:
                - strong [ref=e141]: "क्षमता:"
                - text: 300 व्यक्ती
            - paragraph [ref=e142]:
              - generic [ref=e143]: 💰
              - generic [ref=e144]:
                - strong [ref=e145]: "भाडे:"
                - text: ₹20,000 / दिवस
          - generic [ref=e146]:
            - link "📞 कॉल करा" [ref=e147] [cursor=pointer]:
              - /url: tel:9876543210
            - link "💬 WhatsApp" [ref=e148] [cursor=pointer]:
              - /url: https://wa.me/919876543210
        - generic [ref=e149]:
          - generic [ref=e150]:
            - heading "🏛️ Playwright Test Mangal Karyalay" [level=2] [ref=e151]
            - generic [ref=e153]: 📍 पुणे
          - generic [ref=e154]:
            - paragraph [ref=e155]:
              - generic [ref=e156]: 🗺️
              - generic [ref=e157]: 123 Test Nagar, Shivajinagar
            - paragraph [ref=e158]:
              - generic [ref=e159]: 👥
              - generic [ref=e160]:
                - strong [ref=e161]: "क्षमता:"
                - text: 300 व्यक्ती
            - paragraph [ref=e162]:
              - generic [ref=e163]: 💰
              - generic [ref=e164]:
                - strong [ref=e165]: "भाडे:"
                - text: ₹20,000 / दिवस
          - generic [ref=e166]:
            - link "📞 कॉल करा" [ref=e167] [cursor=pointer]:
              - /url: tel:9876543210
            - link "💬 WhatsApp" [ref=e168] [cursor=pointer]:
              - /url: https://wa.me/919876543210
        - generic [ref=e169]:
          - generic [ref=e170]:
            - heading "🏛️ Playwright Test Mangal Karyalay" [level=2] [ref=e171]
            - generic [ref=e173]: 📍 पुणे
          - generic [ref=e174]:
            - paragraph [ref=e175]:
              - generic [ref=e176]: 🗺️
              - generic [ref=e177]: 123 Test Nagar, Shivajinagar
            - paragraph [ref=e178]:
              - generic [ref=e179]: 👥
              - generic [ref=e180]:
                - strong [ref=e181]: "क्षमता:"
                - text: 300 व्यक्ती
            - paragraph [ref=e182]:
              - generic [ref=e183]: 💰
              - generic [ref=e184]:
                - strong [ref=e185]: "भाडे:"
                - text: ₹20,000 / दिवस
          - generic [ref=e186]:
            - link "📞 कॉल करा" [ref=e187] [cursor=pointer]:
              - /url: tel:9876543210
            - link "💬 WhatsApp" [ref=e188] [cursor=pointer]:
              - /url: https://wa.me/919876543210
        - generic [ref=e189]:
          - generic [ref=e190]:
            - heading "🏛️ Playwright Test Mangal Karyalay" [level=2] [ref=e191]
            - generic [ref=e193]: 📍 पुणे
          - generic [ref=e194]:
            - paragraph [ref=e195]:
              - generic [ref=e196]: 🗺️
              - generic [ref=e197]: 123 Test Nagar, Shivajinagar
            - paragraph [ref=e198]:
              - generic [ref=e199]: 👥
              - generic [ref=e200]:
                - strong [ref=e201]: "क्षमता:"
                - text: 300 व्यक्ती
            - paragraph [ref=e202]:
              - generic [ref=e203]: 💰
              - generic [ref=e204]:
                - strong [ref=e205]: "भाडे:"
                - text: ₹20,000 / दिवस
          - generic [ref=e206]:
            - link "📞 कॉल करा" [ref=e207] [cursor=pointer]:
              - /url: tel:9876543210
            - link "💬 WhatsApp" [ref=e208] [cursor=pointer]:
              - /url: https://wa.me/919876543210
        - generic [ref=e209]:
          - generic [ref=e210]:
            - heading "🏛️ Playwright Test Mangal Karyalay" [level=2] [ref=e211]
            - generic [ref=e213]: 📍 पुणे
          - generic [ref=e214]:
            - paragraph [ref=e215]:
              - generic [ref=e216]: 🗺️
              - generic [ref=e217]: 123 Test Nagar, Shivajinagar
            - paragraph [ref=e218]:
              - generic [ref=e219]: 👥
              - generic [ref=e220]:
                - strong [ref=e221]: "क्षमता:"
                - text: 300 व्यक्ती
            - paragraph [ref=e222]:
              - generic [ref=e223]: 💰
              - generic [ref=e224]:
                - strong [ref=e225]: "भाडे:"
                - text: ₹20,000 / दिवस
          - generic [ref=e226]:
            - link "📞 कॉल करा" [ref=e227] [cursor=pointer]:
              - /url: tel:9876543210
            - link "💬 WhatsApp" [ref=e228] [cursor=pointer]:
              - /url: https://wa.me/919876543210
        - generic [ref=e229]:
          - generic [ref=e230]:
            - heading "🏛️ Playwright Test Mangal Karyalay" [level=2] [ref=e231]
            - generic [ref=e233]: 📍 पुणे
          - generic [ref=e234]:
            - paragraph [ref=e235]:
              - generic [ref=e236]: 🗺️
              - generic [ref=e237]: 123 Test Nagar, Shivajinagar
            - paragraph [ref=e238]:
              - generic [ref=e239]: 👥
              - generic [ref=e240]:
                - strong [ref=e241]: "क्षमता:"
                - text: 300 व्यक्ती
            - paragraph [ref=e242]:
              - generic [ref=e243]: 💰
              - generic [ref=e244]:
                - strong [ref=e245]: "भाडे:"
                - text: ₹20,000 / दिवस
          - generic [ref=e246]:
            - link "📞 कॉल करा" [ref=e247] [cursor=pointer]:
              - /url: tel:9876543210
            - link "💬 WhatsApp" [ref=e248] [cursor=pointer]:
              - /url: https://wa.me/919876543210
        - generic [ref=e249]:
          - generic [ref=e250]:
            - heading "🏛️ सुवर्ण मंगल कार्यालय" [level=2] [ref=e251]
            - generic [ref=e253]: 📍 पुणे
          - generic [ref=e254]:
            - paragraph [ref=e255]:
              - generic [ref=e256]: 🗺️
              - generic [ref=e257]: कोथरूड, पुणे
            - paragraph [ref=e258]:
              - generic [ref=e259]: 👥
              - generic [ref=e260]:
                - strong [ref=e261]: "क्षमता:"
                - text: 500 व्यक्ती
            - paragraph [ref=e262]:
              - generic [ref=e263]: 💰
              - generic [ref=e264]:
                - strong [ref=e265]: "भाडे:"
                - text: ₹25,000 / दिवस
          - generic [ref=e266]:
            - link "📞 कॉल करा" [ref=e267] [cursor=pointer]:
              - /url: tel:9876543210
            - link "💬 WhatsApp" [ref=e268] [cursor=pointer]:
              - /url: https://wa.me/919876543210
        - generic [ref=e269]:
          - generic [ref=e270]:
            - heading "🏛️ शुभ विवाह हॉल" [level=2] [ref=e271]
            - generic [ref=e273]: 📍 पुणे
          - generic [ref=e274]:
            - paragraph [ref=e275]:
              - generic [ref=e276]: 🗺️
              - generic [ref=e277]: वाकड, पुणे
            - paragraph [ref=e278]:
              - generic [ref=e279]: 👥
              - generic [ref=e280]:
                - strong [ref=e281]: "क्षमता:"
                - text: 300 व्यक्ती
            - paragraph [ref=e282]:
              - generic [ref=e283]: 💰
              - generic [ref=e284]:
                - strong [ref=e285]: "भाडे:"
                - text: ₹18,000 / दिवस
          - generic [ref=e286]:
            - link "📞 कॉल करा" [ref=e287] [cursor=pointer]:
              - /url: tel:9988776655
            - link "💬 WhatsApp" [ref=e288] [cursor=pointer]:
              - /url: https://wa.me/919988776655
        - generic [ref=e289]:
          - generic [ref=e290]:
            - heading "🏛️ गजानन मंगल कार्यालय" [level=2] [ref=e291]
            - generic [ref=e293]: 📍 पुणे
          - generic [ref=e294]:
            - paragraph [ref=e295]:
              - generic [ref=e296]: 🗺️
              - generic [ref=e297]: हडपसर, पुणे
            - paragraph [ref=e298]:
              - generic [ref=e299]: 👥
              - generic [ref=e300]:
                - strong [ref=e301]: "क्षमता:"
                - text: 400 व्यक्ती
            - paragraph [ref=e302]:
              - generic [ref=e303]: 💰
              - generic [ref=e304]:
                - strong [ref=e305]: "भाडे:"
                - text: ₹20,000 / दिवस
          - generic [ref=e306]:
            - link "📞 कॉल करा" [ref=e307] [cursor=pointer]:
              - /url: tel:9123456789
            - link "💬 WhatsApp" [ref=e308] [cursor=pointer]:
              - /url: https://wa.me/9123456789
  - contentinfo [ref=e309]:
    - generic [ref=e310]:
      - generic [ref=e311]:
        - generic [ref=e312]:
          - img "Poojaris — For All Poojas" [ref=e314]
          - paragraph [ref=e315]: महाराष्ट्रातील सर्वोत्तम पूजा बुकिंग सेवा. विश्वासू पुजारी, वेळेवर सेवा, आणि पारंपरिक विधी.
          - generic [ref=e316]:
            - link "Facebook" [ref=e317] [cursor=pointer]:
              - /url: https://facebook.com
              - img [ref=e318]
            - link "Instagram" [ref=e320] [cursor=pointer]:
              - /url: https://instagram.com
              - img [ref=e321]
            - link "YouTube" [ref=e323] [cursor=pointer]:
              - /url: https://youtube.com
              - img [ref=e324]
            - link "WhatsApp" [ref=e326] [cursor=pointer]:
              - /url: https://wa.me/9561903219
              - img [ref=e327]
        - generic [ref=e329]:
          - heading "त्वरित लिंक" [level=3] [ref=e330]
          - list [ref=e331]:
            - listitem [ref=e332]:
              - link "› मुख्यपृष्ठ" [ref=e333] [cursor=pointer]:
                - /url: /
            - listitem [ref=e334]:
              - link "› पूजा बुक करा" [ref=e335] [cursor=pointer]:
                - /url: /pooja
            - listitem [ref=e336]:
              - link "› ऑनलाइन पूजा" [ref=e337] [cursor=pointer]:
                - /url: /online-puja
            - listitem [ref=e338]:
              - link "› ब्लॉग" [ref=e339] [cursor=pointer]:
                - /url: /blog
            - listitem [ref=e340]:
              - link "› सर्व शहरे" [ref=e341] [cursor=pointer]:
                - /url: /cities
            - listitem [ref=e342]:
              - link "› पुजारी व्हा" [ref=e343] [cursor=pointer]:
                - /url: /pujari-nondni
            - listitem [ref=e344]:
              - link "› आमच्याबद्दल" [ref=e345] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e346]:
              - link "› संपर्क करा" [ref=e347] [cursor=pointer]:
                - /url: /contact
        - generic [ref=e348]:
          - heading "पूजा श्रेणी" [level=3] [ref=e349]
          - list [ref=e350]:
            - listitem [ref=e351]:
              - link "› गृह पूजा" [ref=e352] [cursor=pointer]:
                - /url: /pooja/gruh-pooja
            - listitem [ref=e353]:
              - link "› हवन / जाप" [ref=e354] [cursor=pointer]:
                - /url: /pooja/havan-jaap
            - listitem [ref=e355]:
              - link "› कथा / नित्य" [ref=e356] [cursor=pointer]:
                - /url: /pooja/katha-nitya
            - listitem [ref=e357]:
              - link "› पित्रुश्राद्ध" [ref=e358] [cursor=pointer]:
                - /url: /pooja/pitru-shraddha
            - listitem [ref=e359]:
              - link "› उत्सव पूजा" [ref=e360] [cursor=pointer]:
                - /url: /pooja/utsav-pooja
            - listitem [ref=e361]:
              - link "› वास्तू पूजा" [ref=e362] [cursor=pointer]:
                - /url: /pooja/vastu-pooja
        - generic [ref=e363]:
          - heading "संपर्क माहिती" [level=3] [ref=e364]
          - list [ref=e365]:
            - listitem [ref=e366]:
              - img [ref=e368]
              - link "› info@pojjari.com" [ref=e370] [cursor=pointer]:
                - /url: mailto:info@pojjari.com
            - listitem [ref=e371]:
              - img [ref=e373]
              - link "› ९५६१९०३२१९" [ref=e375] [cursor=pointer]:
                - /url: tel:9561903219
            - listitem [ref=e376]:
              - img [ref=e378]
              - generic [ref=e380]: रत्नागिरी, महाराष्ट्र
            - listitem [ref=e381]:
              - img [ref=e383]
              - generic [ref=e385]: "सोम – रवि: सकाळी ७ ते रात्री ९"
          - generic [ref=e386]:
            - link "गोपनीयता धोरण" [ref=e387] [cursor=pointer]:
              - /url: "#"
            - link "नियम व अटी" [ref=e388] [cursor=pointer]:
              - /url: "#"
            - link "रद्दीकरण धोरण" [ref=e389] [cursor=pointer]:
              - /url: "#"
      - generic [ref=e390]:
        - paragraph [ref=e391]: © 2026 पूजारी. सर्व हक्क राखीव.
        - paragraph [ref=e392]: भक्तीने बनवले — महाराष्ट्रासाठी ❤️
    - link "WhatsApp वर संपर्क करा" [ref=e393] [cursor=pointer]:
      - /url: https://wa.me/9561903219?text=नमस्कार! मला पूजा बुक करायची आहे.
      - img [ref=e394]
    - button "पूजारी Assistant" [ref=e396] [cursor=pointer]:
      - img [ref=e397]
```

# Test source

```ts
  1   | // e2e/tests/hall-booking.spec.js
  2   | // Tests: District/Taluka search, SearchableSelect, Map auto-center,
  3   | //        Admin Hall CRUD with geocoding, hover popups, existing hall markers
  4   | const { test, expect } = require('@playwright/test');
  5   | 
  6   | const API_URL        = 'http://localhost:5000/api';
  7   | const ADMIN_PHONE    = '9307720459';
  8   | const ADMIN_PASSWORD = 'Admin@123';
  9   | 
  10  | const TEST_HALL = {
  11  |   name:          'Playwright Test Mangal Karyalay',
  12  |   phone:         '9876543210',
  13  |   whatsapp:      '9876543210',
  14  |   district:      'पुणे',
  15  |   taluka:        'पुणे शहर',
  16  |   city:          'Shivajinagar',
  17  |   address:       '123 Test Nagar, Shivajinagar',
  18  |   capacity:      '300',
  19  |   price_per_day: '20000',
  20  | };
  21  | 
  22  | async function waitForLoad(page) {
  23  |   await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  24  | }
  25  | 
  26  | async function adminLogin(page) {
  27  |   const res = await page.request.post(`${API_URL}/auth/login`, {
  28  |     data: { phone: ADMIN_PHONE, password: ADMIN_PASSWORD },
  29  |   });
  30  |   if (res.ok()) {
  31  |     const body = await res.json();
  32  |     await page.goto('/');
  33  |     await page.evaluate(({ tok, usr }) => {
  34  |       if (tok) {
  35  |         localStorage.setItem('pojjari_token', tok);
  36  |         localStorage.setItem('pojjari_user', JSON.stringify(usr));
  37  |       }
  38  |     }, { tok: body.data?.token, usr: body.data?.user });
  39  |   }
  40  | }
  41  | 
  42  | async function gotoHalls(page) {
  43  |   await page.goto('/admin/halls');
  44  |   await page.waitForURL('**/admin/halls', { timeout: 8000 }).catch(() => {});
  45  |   await waitForLoad(page);
  46  |   await page.waitForTimeout(600);
  47  | }
  48  | 
  49  | // ═══════════════════════════════════════════════════════════════════
  50  | // SECTION 1 — Hall Booking Page (Customer)
  51  | // ═══════════════════════════════════════════════════════════════════
  52  | 
  53  | test.describe('Hall Booking — Customer Search', () => {
  54  | 
  55  |   test('TC-HB-01: page loads with title and subtitle', async ({ page }) => {
  56  |     await page.goto('/hall-booking');
  57  |     await waitForLoad(page);
  58  |     await expect(page.locator('h1').first()).toContainText('हॉल बुकिंग');
> 59  |     await expect(page.locator('[class*="pageSubtitle"]')).toBeVisible();
      |                                                           ^ Error: expect(locator).toBeVisible() failed
  60  |   });
  61  | 
  62  |   test('TC-HB-02: district SearchableSelect renders with placeholder', async ({ page }) => {
  63  |     await page.goto('/hall-booking');
  64  |     await waitForLoad(page);
  65  |     const trigger = page.locator('[class*="trigger"]').first();
  66  |     await expect(trigger).toBeVisible();
  67  |     await expect(trigger).toContainText('जिल्हा निवडा');
  68  |   });
  69  | 
  70  |   test('TC-HB-03: clicking district dropdown opens search box', async ({ page }) => {
  71  |     await page.goto('/hall-booking');
  72  |     await waitForLoad(page);
  73  |     await page.locator('[class*="trigger"]').first().click();
  74  |     const searchInput = page.locator('[class*="searchInput"]').first();
  75  |     await expect(searchInput).toBeVisible({ timeout: 3000 });
  76  |   });
  77  | 
  78  |   test('TC-HB-04: typing "rtn" finds रत्नागिरी (subsequence match)', async ({ page }) => {
  79  |     await page.goto('/hall-booking');
  80  |     await waitForLoad(page);
  81  |     await page.locator('[class*="trigger"]').first().click();
  82  |     await page.locator('[class*="searchInput"]').first().fill('rtn');
  83  |     await page.waitForTimeout(300);
  84  |     const items = page.locator('[class*="itemLabel"]');
  85  |     const found = await items.filter({ hasText: 'रत्नागिरी' }).count();
  86  |     expect(found).toBeGreaterThan(0);
  87  |   });
  88  | 
  89  |   test('TC-HB-05: typing "pune" finds पुणे district', async ({ page }) => {
  90  |     await page.goto('/hall-booking');
  91  |     await waitForLoad(page);
  92  |     await page.locator('[class*="trigger"]').first().click();
  93  |     await page.locator('[class*="searchInput"]').first().fill('pune');
  94  |     await page.waitForTimeout(300);
  95  |     const found = await page.locator('[class*="itemLabel"]').filter({ hasText: 'पुणे' }).count();
  96  |     expect(found).toBeGreaterThan(0);
  97  |   });
  98  | 
  99  |   test('TC-HB-06: selecting district enables taluka dropdown', async ({ page }) => {
  100 |     await page.goto('/hall-booking');
  101 |     await waitForLoad(page);
  102 |     // open district dropdown, pick पुणे
  103 |     await page.locator('[class*="trigger"]').first().click();
  104 |     await page.locator('[class*="searchInput"]').first().fill('pune');
  105 |     await page.waitForTimeout(300);
  106 |     await page.locator('[class*="itemLabel"]').filter({ hasText: /^पुणे$/ }).first().click();
  107 |     await page.waitForTimeout(300);
  108 |     // Taluka trigger should now be enabled
  109 |     const talukaTrigger = page.locator('[class*="trigger"]').nth(1);
  110 |     await expect(talukaTrigger).not.toHaveAttribute('disabled');
  111 |   });
  112 | 
  113 |   test('TC-HB-07: taluka dropdown lists talukas after district selected', async ({ page }) => {
  114 |     await page.goto('/hall-booking');
  115 |     await waitForLoad(page);
  116 |     // select पुणे district
  117 |     await page.locator('[class*="trigger"]').first().click();
  118 |     await page.locator('[class*="searchInput"]').first().fill('pune');
  119 |     await page.waitForTimeout(300);
  120 |     await page.locator('[class*="itemLabel"]').filter({ hasText: /^पुणे$/ }).first().click();
  121 |     await page.waitForTimeout(300);
  122 |     // open taluka dropdown
  123 |     await page.locator('[class*="trigger"]').nth(1).click();
  124 |     const talukaItems = page.locator('[class*="itemLabel"]');
  125 |     await expect(talukaItems.first()).toBeVisible({ timeout: 3000 });
  126 |     const count = await talukaItems.count();
  127 |     expect(count).toBeGreaterThan(3); // Pune has 14 talukas
  128 |   });
  129 | 
  130 |   test('TC-HB-08: शोधा button disabled when no district selected', async ({ page }) => {
  131 |     await page.goto('/hall-booking');
  132 |     await waitForLoad(page);
  133 |     const searchBtn = page.locator('button:has-text("शोधा")');
  134 |     await expect(searchBtn).toBeDisabled();
  135 |   });
  136 | 
  137 |   test('TC-HB-09: शोधा button enabled after district selected', async ({ page }) => {
  138 |     await page.goto('/hall-booking');
  139 |     await waitForLoad(page);
  140 |     await page.locator('[class*="trigger"]').first().click();
  141 |     await page.locator('[class*="searchInput"]').first().fill('nagpur');
  142 |     await page.waitForTimeout(300);
  143 |     await page.locator('[class*="itemLabel"]').filter({ hasText: 'नागपूर' }).first().click();
  144 |     const searchBtn = page.locator('button:has-text("शोधा")');
  145 |     await expect(searchBtn).toBeEnabled({ timeout: 3000 });
  146 |   });
  147 | 
  148 |   test('TC-HB-10: searching by district fires API with district param', async ({ page }) => {
  149 |     await page.goto('/hall-booking');
  150 |     await waitForLoad(page);
  151 |     // Select district
  152 |     await page.locator('[class*="trigger"]').first().click();
  153 |     await page.locator('[class*="searchInput"]').first().fill('pune');
  154 |     await page.waitForTimeout(300);
  155 |     await page.locator('[class*="itemLabel"]').filter({ hasText: /^पुणे$/ }).first().click();
  156 |     await page.waitForTimeout(300);
  157 |     // Click search and watch request
  158 |     const [req] = await Promise.all([
  159 |       page.waitForRequest(r => r.url().includes('/halls') && r.url().includes('district='), { timeout: 5000 }),
```