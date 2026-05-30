# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: poojas.spec.js >> Pooja CRUD Flow >> Manage Poojas — Add Pooja Form >> TC-AP-04: रद्द करा resets and hides the form
- Location: tests\poojas.spec.js:410:3

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('button:has-text("रद्द करा")')
    - locator resolved to <button type="button" class="btn btn-secondary">✕ रद्द करा</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - performing click action

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
      - heading "Manage Poojas" [level=2] [ref=e81]
      - generic [ref=e83]:
        - img [ref=e84]
        - text: Test Admin
    - generic [ref=e87]:
      - generic [ref=e88]:
        - heading "🪔 पूजा व्यवस्थापन" [level=1] [ref=e89]
        - button "+ नवीन पूजा जोडा" [ref=e90] [cursor=pointer]
      - table [ref=e92]:
        - rowgroup [ref=e93]:
          - row "छायाचित्र नाव श्रेणी किंमत (₹) कालावधी लोकप्रिय कृती" [ref=e94]:
            - columnheader "छायाचित्र" [ref=e95]
            - columnheader "नाव" [ref=e96]
            - columnheader "श्रेणी" [ref=e97]
            - columnheader "किंमत (₹)" [ref=e98]
            - columnheader "कालावधी" [ref=e99]
            - columnheader "लोकप्रिय" [ref=e100]
            - columnheader "कृती" [ref=e101]
        - rowgroup [ref=e102]:
          - row "सत्यनारायण पूजा 🔄 बदला सत्यनारायण पूजा satyanarayan-pooja गृह पूजा ₹४,५०० 2.5 तास ⭐ हो ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e103]:
            - cell "सत्यनारायण पूजा 🔄 बदला" [ref=e104]:
              - generic [ref=e105]:
                - img "सत्यनारायण पूजा" [ref=e107]
                - button "🔄 बदला" [ref=e108] [cursor=pointer]
            - cell "सत्यनारायण पूजा satyanarayan-pooja" [ref=e109]:
              - strong [ref=e110]: सत्यनारायण पूजा
              - text: satyanarayan-pooja
            - cell "गृह पूजा" [ref=e111]
            - cell "₹४,५००" [ref=e112]:
              - strong [ref=e113]: ₹४,५००
            - cell "2.5 तास" [ref=e114]
            - cell "⭐ हो" [ref=e115]:
              - button "⭐ हो" [ref=e116] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e117]:
              - generic:
                - button "✏️ संपादित" [ref=e118] [cursor=pointer]
                - button "₹ किंमत" [ref=e119] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e120] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e121] [cursor=pointer]
                - button "🗑️ काढा" [ref=e122] [cursor=pointer]
          - row "🪔 🔄 बदला मुंज / उपनयन संस्कार munj-upanayan गृह पूजा ₹५,००० 4 तास ⭐ हो ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e123]:
            - cell "🪔 🔄 बदला" [ref=e124]:
              - generic [ref=e125]:
                - generic [ref=e127]: 🪔
                - button "🔄 बदला" [ref=e128] [cursor=pointer]
            - cell "मुंज / उपनयन संस्कार munj-upanayan" [ref=e129]:
              - strong [ref=e130]: मुंज / उपनयन संस्कार
              - text: munj-upanayan
            - cell "गृह पूजा" [ref=e131]
            - cell "₹५,०००" [ref=e132]:
              - strong [ref=e133]: ₹५,०००
            - cell "4 तास" [ref=e134]
            - cell "⭐ हो" [ref=e135]:
              - button "⭐ हो" [ref=e136] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e137]:
              - generic:
                - button "✏️ संपादित" [ref=e138] [cursor=pointer]
                - button "₹ किंमत" [ref=e139] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e140] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e141] [cursor=pointer]
                - button "🗑️ काढा" [ref=e142] [cursor=pointer]
          - row "🪔 🔄 बदला महा मृत्युंजय जाप maha-mrityunjay-jap हवन / जाप ₹५,००१ 3 तास ⭐ हो ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e143]:
            - cell "🪔 🔄 बदला" [ref=e144]:
              - generic [ref=e145]:
                - generic [ref=e147]: 🪔
                - button "🔄 बदला" [ref=e148] [cursor=pointer]
            - cell "महा मृत्युंजय जाप maha-mrityunjay-jap" [ref=e149]:
              - strong [ref=e150]: महा मृत्युंजय जाप
              - text: maha-mrityunjay-jap
            - cell "हवन / जाप" [ref=e151]
            - cell "₹५,००१" [ref=e152]:
              - strong [ref=e153]: ₹५,००१
            - cell "3 तास" [ref=e154]
            - cell "⭐ हो" [ref=e155]:
              - button "⭐ हो" [ref=e156] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e157]:
              - generic:
                - button "✏️ संपादित" [ref=e158] [cursor=pointer]
                - button "₹ किंमत" [ref=e159] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e160] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e161] [cursor=pointer]
                - button "🗑️ काढा" [ref=e162] [cursor=pointer]
          - row "दशक्रिया विधी 🔄 बदला दशक्रिया विधी dashkriya-vidhi पित्रुश्राद्ध ₹१,५०० 3 तास ⭐ हो ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e163]:
            - cell "दशक्रिया विधी 🔄 बदला" [ref=e164]:
              - generic [ref=e165]:
                - img "दशक्रिया विधी" [ref=e167]
                - button "🔄 बदला" [ref=e168] [cursor=pointer]
            - cell "दशक्रिया विधी dashkriya-vidhi" [ref=e169]:
              - strong [ref=e170]: दशक्रिया विधी
              - text: dashkriya-vidhi
            - cell "पित्रुश्राद्ध" [ref=e171]
            - cell "₹१,५००" [ref=e172]:
              - strong [ref=e173]: ₹१,५००
            - cell "3 तास" [ref=e174]
            - cell "⭐ हो" [ref=e175]:
              - button "⭐ हो" [ref=e176] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e177]:
              - generic:
                - button "✏️ संपादित" [ref=e178] [cursor=pointer]
                - button "₹ किंमत" [ref=e179] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e180] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e181] [cursor=pointer]
                - button "🗑️ काढा" [ref=e182] [cursor=pointer]
          - row "गणपती स्थापना 🔄 बदला गणपती स्थापना ganpati-sthapna उत्सव पूजा ₹५,०९८ 2 तास ⭐ हो ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e183]:
            - cell "गणपती स्थापना 🔄 बदला" [ref=e184]:
              - generic [ref=e185]:
                - img "गणपती स्थापना" [ref=e187]
                - button "🔄 बदला" [ref=e188] [cursor=pointer]
            - cell "गणपती स्थापना ganpati-sthapna" [ref=e189]:
              - strong [ref=e190]: गणपती स्थापना
              - text: ganpati-sthapna
            - cell "उत्सव पूजा" [ref=e191]
            - cell "₹५,०९८" [ref=e192]:
              - strong [ref=e193]: ₹५,०९८
            - cell "2 तास" [ref=e194]
            - cell "⭐ हो" [ref=e195]:
              - button "⭐ हो" [ref=e196] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e197]:
              - generic:
                - button "✏️ संपादित" [ref=e198] [cursor=pointer]
                - button "₹ किंमत" [ref=e199] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e200] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e201] [cursor=pointer]
                - button "🗑️ काढा" [ref=e202] [cursor=pointer]
          - row "लक्ष्मी पूजन (दिवाळी) 🔄 बदला लक्ष्मी पूजन (दिवाळी) lakshmi-poojan-diwali उत्सव पूजा ₹३,६८२ 2 तास ⭐ हो ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e203]:
            - cell "लक्ष्मी पूजन (दिवाळी) 🔄 बदला" [ref=e204]:
              - generic [ref=e205]:
                - img "लक्ष्मी पूजन (दिवाळी)" [ref=e207]
                - button "🔄 बदला" [ref=e208] [cursor=pointer]
            - cell "लक्ष्मी पूजन (दिवाळी) lakshmi-poojan-diwali" [ref=e209]:
              - strong [ref=e210]: लक्ष्मी पूजन (दिवाळी)
              - text: lakshmi-poojan-diwali
            - cell "उत्सव पूजा" [ref=e211]
            - cell "₹३,६८२" [ref=e212]:
              - strong [ref=e213]: ₹३,६८२
            - cell "2 तास" [ref=e214]
            - cell "⭐ हो" [ref=e215]:
              - button "⭐ हो" [ref=e216] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e217]:
              - generic:
                - button "✏️ संपादित" [ref=e218] [cursor=pointer]
                - button "₹ किंमत" [ref=e219] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e220] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e221] [cursor=pointer]
                - button "🗑️ काढा" [ref=e222] [cursor=pointer]
          - row "गृहप्रवेश व गृहशांती 🔄 बदला गृहप्रवेश व गृहशांती gruhpravesh-gruhshanti वास्तू पूजा ₹५,००१ 4 तास ⭐ हो ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e223]:
            - cell "गृहप्रवेश व गृहशांती 🔄 बदला" [ref=e224]:
              - generic [ref=e225]:
                - img "गृहप्रवेश व गृहशांती" [ref=e227]
                - button "🔄 बदला" [ref=e228] [cursor=pointer]
            - cell "गृहप्रवेश व गृहशांती gruhpravesh-gruhshanti" [ref=e229]:
              - strong [ref=e230]: गृहप्रवेश व गृहशांती
              - text: gruhpravesh-gruhshanti
            - cell "वास्तू पूजा" [ref=e231]
            - cell "₹५,००१" [ref=e232]:
              - strong [ref=e233]: ₹५,००१
            - cell "4 तास" [ref=e234]
            - cell "⭐ हो" [ref=e235]:
              - button "⭐ हो" [ref=e236] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e237]:
              - generic:
                - button "✏️ संपादित" [ref=e238] [cursor=pointer]
                - button "₹ किंमत" [ref=e239] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e240] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e241] [cursor=pointer]
                - button "🗑️ काढा" [ref=e242] [cursor=pointer]
          - row "लग्न विधी 🔄 बदला लग्न विधी lagn-vidhi गृह पूजा ₹५,००० 5 तास ⭐ हो ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e243]:
            - cell "लग्न विधी 🔄 बदला" [ref=e244]:
              - generic [ref=e245]:
                - img "लग्न विधी" [ref=e247]
                - button "🔄 बदला" [ref=e248] [cursor=pointer]
            - cell "लग्न विधी lagn-vidhi" [ref=e249]:
              - strong [ref=e250]: लग्न विधी
              - text: lagn-vidhi
            - cell "गृह पूजा" [ref=e251]
            - cell "₹५,०००" [ref=e252]:
              - strong [ref=e253]: ₹५,०००
            - cell "5 तास" [ref=e254]
            - cell "⭐ हो" [ref=e255]:
              - button "⭐ हो" [ref=e256] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e257]:
              - generic:
                - button "✏️ संपादित" [ref=e258] [cursor=pointer]
                - button "₹ किंमत" [ref=e259] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e260] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e261] [cursor=pointer]
                - button "🗑️ काढा" [ref=e262] [cursor=pointer]
          - row "🪔 🔄 बदला बाळ शॉवर पूजा baby-shower-pooja गृह पूजा ₹३,८५८ 2 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e263]:
            - cell "🪔 🔄 बदला" [ref=e264]:
              - generic [ref=e265]:
                - generic [ref=e267]: 🪔
                - button "🔄 बदला" [ref=e268] [cursor=pointer]
            - cell "बाळ शॉवर पूजा baby-shower-pooja" [ref=e269]:
              - strong [ref=e270]: बाळ शॉवर पूजा
              - text: baby-shower-pooja
            - cell "गृह पूजा" [ref=e271]
            - cell "₹३,८५८" [ref=e272]:
              - strong [ref=e273]: ₹३,८५८
            - cell "2 तास" [ref=e274]
            - cell "☆ नाही" [ref=e275]:
              - button "☆ नाही" [ref=e276] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e277]:
              - generic:
                - button "✏️ संपादित" [ref=e278] [cursor=pointer]
                - button "₹ किंमत" [ref=e279] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e280] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e281] [cursor=pointer]
                - button "🗑️ काढा" [ref=e282] [cursor=pointer]
          - row "🪔 🔄 बदला वाढदिवस पूजा birthday-pooja गृह पूजा ₹२,९७४ 1.5 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e283]:
            - cell "🪔 🔄 बदला" [ref=e284]:
              - generic [ref=e285]:
                - generic [ref=e287]: 🪔
                - button "🔄 बदला" [ref=e288] [cursor=pointer]
            - cell "वाढदिवस पूजा birthday-pooja" [ref=e289]:
              - strong [ref=e290]: वाढदिवस पूजा
              - text: birthday-pooja
            - cell "गृह पूजा" [ref=e291]
            - cell "₹२,९७४" [ref=e292]:
              - strong [ref=e293]: ₹२,९७४
            - cell "1.5 तास" [ref=e294]
            - cell "☆ नाही" [ref=e295]:
              - button "☆ नाही" [ref=e296] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e297]:
              - generic:
                - button "✏️ संपादित" [ref=e298] [cursor=pointer]
                - button "₹ किंमत" [ref=e299] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e300] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e301] [cursor=pointer]
                - button "🗑️ काढा" [ref=e302] [cursor=pointer]
          - row "साखरपुडा पूजा 🔄 बदला साखरपुडा पूजा engagement-pooja गृह पूजा ₹३,९६४ 2 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e303]:
            - cell "साखरपुडा पूजा 🔄 बदला" [ref=e304]:
              - generic [ref=e305]:
                - img "साखरपुडा पूजा" [ref=e307]
                - button "🔄 बदला" [ref=e308] [cursor=pointer]
            - cell "साखरपुडा पूजा engagement-pooja" [ref=e309]:
              - strong [ref=e310]: साखरपुडा पूजा
              - text: engagement-pooja
            - cell "गृह पूजा" [ref=e311]
            - cell "₹३,९६४" [ref=e312]:
              - strong [ref=e313]: ₹३,९६४
            - cell "2 तास" [ref=e314]
            - cell "☆ नाही" [ref=e315]:
              - button "☆ नाही" [ref=e316] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e317]:
              - generic:
                - button "✏️ संपादित" [ref=e318] [cursor=pointer]
                - button "₹ किंमत" [ref=e319] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e320] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e321] [cursor=pointer]
                - button "🗑️ काढा" [ref=e322] [cursor=pointer]
          - row "नवग्रह शांती हवन 🔄 बदला नवग्रह शांती हवन navgraha-shanti-havan हवन / जाप ₹५,०९८ 4 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e323]:
            - cell "नवग्रह शांती हवन 🔄 बदला" [ref=e324]:
              - generic [ref=e325]:
                - img "नवग्रह शांती हवन" [ref=e327]
                - button "🔄 बदला" [ref=e328] [cursor=pointer]
            - cell "नवग्रह शांती हवन navgraha-shanti-havan" [ref=e329]:
              - strong [ref=e330]: नवग्रह शांती हवन
              - text: navgraha-shanti-havan
            - cell "हवन / जाप" [ref=e331]
            - cell "₹५,०९८" [ref=e332]:
              - strong [ref=e333]: ₹५,०९८
            - cell "4 तास" [ref=e334]
            - cell "☆ नाही" [ref=e335]:
              - button "☆ नाही" [ref=e336] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e337]:
              - generic:
                - button "✏️ संपादित" [ref=e338] [cursor=pointer]
                - button "₹ किंमत" [ref=e339] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e340] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e341] [cursor=pointer]
                - button "🗑️ काढा" [ref=e342] [cursor=pointer]
          - row "🪔 🔄 बदला धन्वंतरी हवन dhanvantari-havan हवन / जाप ₹५,५२४ 3 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e343]:
            - cell "🪔 🔄 बदला" [ref=e344]:
              - generic [ref=e345]:
                - generic [ref=e347]: 🪔
                - button "🔄 बदला" [ref=e348] [cursor=pointer]
            - cell "धन्वंतरी हवन dhanvantari-havan" [ref=e349]:
              - strong [ref=e350]: धन्वंतरी हवन
              - text: dhanvantari-havan
            - cell "हवन / जाप" [ref=e351]
            - cell "₹५,५२४" [ref=e352]:
              - strong [ref=e353]: ₹५,५२४
            - cell "3 तास" [ref=e354]
            - cell "☆ नाही" [ref=e355]:
              - button "☆ नाही" [ref=e356] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e357]:
              - generic:
                - button "✏️ संपादित" [ref=e358] [cursor=pointer]
                - button "₹ किंमत" [ref=e359] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e360] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e361] [cursor=pointer]
                - button "🗑️ काढा" [ref=e362] [cursor=pointer]
          - row "🪔 🔄 बदला सरस्वती हवन saraswati-havan हवन / जाप ₹४,५३१ 3 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e363]:
            - cell "🪔 🔄 बदला" [ref=e364]:
              - generic [ref=e365]:
                - generic [ref=e367]: 🪔
                - button "🔄 बदला" [ref=e368] [cursor=pointer]
            - cell "सरस्वती हवन saraswati-havan" [ref=e369]:
              - strong [ref=e370]: सरस्वती हवन
              - text: saraswati-havan
            - cell "हवन / जाप" [ref=e371]
            - cell "₹४,५३१" [ref=e372]:
              - strong [ref=e373]: ₹४,५३१
            - cell "3 तास" [ref=e374]
            - cell "☆ नाही" [ref=e375]:
              - button "☆ नाही" [ref=e376] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e377]:
              - generic:
                - button "✏️ संपादित" [ref=e378] [cursor=pointer]
                - button "₹ किंमत" [ref=e379] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e380] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e381] [cursor=pointer]
                - button "🗑️ काढा" [ref=e382] [cursor=pointer]
          - row "🪔 🔄 बदला गणपती अथर्वशीर्ष हवन ganpati-atharvashirsha हवन / जाप ₹४,५३१ 3 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e383]:
            - cell "🪔 🔄 बदला" [ref=e384]:
              - generic [ref=e385]:
                - generic [ref=e387]: 🪔
                - button "🔄 बदला" [ref=e388] [cursor=pointer]
            - cell "गणपती अथर्वशीर्ष हवन ganpati-atharvashirsha" [ref=e389]:
              - strong [ref=e390]: गणपती अथर्वशीर्ष हवन
              - text: ganpati-atharvashirsha
            - cell "हवन / जाप" [ref=e391]
            - cell "₹४,५३१" [ref=e392]:
              - strong [ref=e393]: ₹४,५३१
            - cell "3 तास" [ref=e394]
            - cell "☆ नाही" [ref=e395]:
              - button "☆ नाही" [ref=e396] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e397]:
              - generic:
                - button "✏️ संपादित" [ref=e398] [cursor=pointer]
                - button "₹ किंमत" [ref=e399] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e400] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e401] [cursor=pointer]
                - button "🗑️ काढा" [ref=e402] [cursor=pointer]
          - row "🪔 🔄 बदला नवचंडी याग navchandi-yag हवन / जाप ₹१२,४४१ 9 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e403]:
            - cell "🪔 🔄 बदला" [ref=e404]:
              - generic [ref=e405]:
                - generic [ref=e407]: 🪔
                - button "🔄 बदला" [ref=e408] [cursor=pointer]
            - cell "नवचंडी याग navchandi-yag" [ref=e409]:
              - strong [ref=e410]: नवचंडी याग
              - text: navchandi-yag
            - cell "हवन / जाप" [ref=e411]
            - cell "₹१२,४४१" [ref=e412]:
              - strong [ref=e413]: ₹१२,४४१
            - cell "9 तास" [ref=e414]
            - cell "☆ नाही" [ref=e415]:
              - button "☆ नाही" [ref=e416] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e417]:
              - generic:
                - button "✏️ संपादित" [ref=e418] [cursor=pointer]
                - button "₹ किंमत" [ref=e419] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e420] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e421] [cursor=pointer]
                - button "🗑️ काढा" [ref=e422] [cursor=pointer]
          - row "दत्त याग 🔄 बदला दत्त याग datta-yag हवन / जाप ₹१०,१९५ 6 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e423]:
            - cell "दत्त याग 🔄 बदला" [ref=e424]:
              - generic [ref=e425]:
                - img "दत्त याग" [ref=e427]
                - button "🔄 बदला" [ref=e428] [cursor=pointer]
            - cell "दत्त याग datta-yag" [ref=e429]:
              - strong [ref=e430]: दत्त याग
              - text: datta-yag
            - cell "हवन / जाप" [ref=e431]
            - cell "₹१०,१९५" [ref=e432]:
              - strong [ref=e433]: ₹१०,१९५
            - cell "6 तास" [ref=e434]
            - cell "☆ नाही" [ref=e435]:
              - button "☆ नाही" [ref=e436] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e437]:
              - generic:
                - button "✏️ संपादित" [ref=e438] [cursor=pointer]
                - button "₹ किंमत" [ref=e439] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e440] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e441] [cursor=pointer]
                - button "🗑️ काढा" [ref=e442] [cursor=pointer]
          - row "रुद्राभिषेक 🔄 बदला रुद्राभिषेक rudra-abhishek कथा / नित्य पूजा ₹३,५४० 2 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e443]:
            - cell "रुद्राभिषेक 🔄 बदला" [ref=e444]:
              - generic [ref=e445]:
                - img "रुद्राभिषेक" [ref=e447]
                - button "🔄 बदला" [ref=e448] [cursor=pointer]
            - cell "रुद्राभिषेक rudra-abhishek" [ref=e449]:
              - strong [ref=e450]: रुद्राभिषेक
              - text: rudra-abhishek
            - cell "कथा / नित्य पूजा" [ref=e451]
            - cell "₹३,५४०" [ref=e452]:
              - strong [ref=e453]: ₹३,५४०
            - cell "2 तास" [ref=e454]
            - cell "☆ नाही" [ref=e455]:
              - button "☆ नाही" [ref=e456] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e457]:
              - generic:
                - button "✏️ संपादित" [ref=e458] [cursor=pointer]
                - button "₹ किंमत" [ref=e459] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e460] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e461] [cursor=pointer]
                - button "🗑️ काढा" [ref=e462] [cursor=pointer]
          - row "🪔 🔄 बदला मंगळागौरी पूजा mangalagauri-pooja कथा / नित्य पूजा ₹२,९७३ 2.5 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e463]:
            - cell "🪔 🔄 बदला" [ref=e464]:
              - generic [ref=e465]:
                - generic [ref=e467]: 🪔
                - button "🔄 बदला" [ref=e468] [cursor=pointer]
            - cell "मंगळागौरी पूजा mangalagauri-pooja" [ref=e469]:
              - strong [ref=e470]: मंगळागौरी पूजा
              - text: mangalagauri-pooja
            - cell "कथा / नित्य पूजा" [ref=e471]
            - cell "₹२,९७३" [ref=e472]:
              - strong [ref=e473]: ₹२,९७३
            - cell "2.5 तास" [ref=e474]
            - cell "☆ नाही" [ref=e475]:
              - button "☆ नाही" [ref=e476] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e477]:
              - generic:
                - button "✏️ संपादित" [ref=e478] [cursor=pointer]
                - button "₹ किंमत" [ref=e479] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e480] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e481] [cursor=pointer]
                - button "🗑️ काढा" [ref=e482] [cursor=pointer]
          - row "🪔 🔄 बदला सोमवार पूजा somvar-pooja कथा / नित्य पूजा ₹२,९७४ 1.5 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e483]:
            - cell "🪔 🔄 बदला" [ref=e484]:
              - generic [ref=e485]:
                - generic [ref=e487]: 🪔
                - button "🔄 बदला" [ref=e488] [cursor=pointer]
            - cell "सोमवार पूजा somvar-pooja" [ref=e489]:
              - strong [ref=e490]: सोमवार पूजा
              - text: somvar-pooja
            - cell "कथा / नित्य पूजा" [ref=e491]
            - cell "₹२,९७४" [ref=e492]:
              - strong [ref=e493]: ₹२,९७४
            - cell "1.5 तास" [ref=e494]
            - cell "☆ नाही" [ref=e495]:
              - button "☆ नाही" [ref=e496] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e497]:
              - generic:
                - button "✏️ संपादित" [ref=e498] [cursor=pointer]
                - button "₹ किंमत" [ref=e499] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e500] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e501] [cursor=pointer]
                - button "🗑️ काढा" [ref=e502] [cursor=pointer]
          - row "🪔 🔄 बदला सुंदरकांड पाठ sundarkand-path कथा / नित्य पूजा ₹४,८६२ 3 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e503]:
            - cell "🪔 🔄 बदला" [ref=e504]:
              - generic [ref=e505]:
                - generic [ref=e507]: 🪔
                - button "🔄 बदला" [ref=e508] [cursor=pointer]
            - cell "सुंदरकांड पाठ sundarkand-path" [ref=e509]:
              - strong [ref=e510]: सुंदरकांड पाठ
              - text: sundarkand-path
            - cell "कथा / नित्य पूजा" [ref=e511]
            - cell "₹४,८६२" [ref=e512]:
              - strong [ref=e513]: ₹४,८६२
            - cell "3 तास" [ref=e514]
            - cell "☆ नाही" [ref=e515]:
              - button "☆ नाही" [ref=e516] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e517]:
              - generic:
                - button "✏️ संपादित" [ref=e518] [cursor=pointer]
                - button "₹ किंमत" [ref=e519] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e520] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e521] [cursor=pointer]
                - button "🗑️ काढा" [ref=e522] [cursor=pointer]
          - row "बारावे विधी 🔄 बदला बारावे विधी barave-vidhi पित्रुश्राद्ध ₹३,८०० 2.5 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e523]:
            - cell "बारावे विधी 🔄 बदला" [ref=e524]:
              - generic [ref=e525]:
                - img "बारावे विधी" [ref=e527]
                - button "🔄 बदला" [ref=e528] [cursor=pointer]
            - cell "बारावे विधी barave-vidhi" [ref=e529]:
              - strong [ref=e530]: बारावे विधी
              - text: barave-vidhi
            - cell "पित्रुश्राद्ध" [ref=e531]
            - cell "₹३,८००" [ref=e532]:
              - strong [ref=e533]: ₹३,८००
            - cell "2.5 तास" [ref=e534]
            - cell "☆ नाही" [ref=e535]:
              - button "☆ नाही" [ref=e536] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e537]:
              - generic:
                - button "✏️ संपादित" [ref=e538] [cursor=pointer]
                - button "₹ किंमत" [ref=e539] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e540] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e541] [cursor=pointer]
                - button "🗑️ काढा" [ref=e542] [cursor=pointer]
          - row "🪔 🔄 बदला तेरावे विधी terave-vidhi पित्रुश्राद्ध ₹४,२०० 4 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e543]:
            - cell "🪔 🔄 बदला" [ref=e544]:
              - generic [ref=e545]:
                - generic [ref=e547]: 🪔
                - button "🔄 बदला" [ref=e548] [cursor=pointer]
            - cell "तेरावे विधी terave-vidhi" [ref=e549]:
              - strong [ref=e550]: तेरावे विधी
              - text: terave-vidhi
            - cell "पित्रुश्राद्ध" [ref=e551]
            - cell "₹४,२००" [ref=e552]:
              - strong [ref=e553]: ₹४,२००
            - cell "4 तास" [ref=e554]
            - cell "☆ नाही" [ref=e555]:
              - button "☆ नाही" [ref=e556] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e557]:
              - generic:
                - button "✏️ संपादित" [ref=e558] [cursor=pointer]
                - button "₹ किंमत" [ref=e559] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e560] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e561] [cursor=pointer]
                - button "🗑️ काढा" [ref=e562] [cursor=pointer]
          - row "वार्षिक श्राद्ध विधी 🔄 बदला वार्षिक श्राद्ध विधी varshik-shraddha पित्रुश्राद्ध ₹४,८६२ 3 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e563]:
            - cell "वार्षिक श्राद्ध विधी 🔄 बदला" [ref=e564]:
              - generic [ref=e565]:
                - img "वार्षिक श्राद्ध विधी" [ref=e567]
                - button "🔄 बदला" [ref=e568] [cursor=pointer]
            - cell "वार्षिक श्राद्ध विधी varshik-shraddha" [ref=e569]:
              - strong [ref=e570]: वार्षिक श्राद्ध विधी
              - text: varshik-shraddha
            - cell "पित्रुश्राद्ध" [ref=e571]
            - cell "₹४,८६२" [ref=e572]:
              - strong [ref=e573]: ₹४,८६२
            - cell "3 तास" [ref=e574]
            - cell "☆ नाही" [ref=e575]:
              - button "☆ नाही" [ref=e576] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e577]:
              - generic:
                - button "✏️ संपादित" [ref=e578] [cursor=pointer]
                - button "₹ किंमत" [ref=e579] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e580] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e581] [cursor=pointer]
                - button "🗑️ काढा" [ref=e582] [cursor=pointer]
          - row "🪔 🔄 बदला भरणी श्राद्ध bharani-shraddha पित्रुश्राद्ध ₹४,८६१ 3 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e583]:
            - cell "🪔 🔄 बदला" [ref=e584]:
              - generic [ref=e585]:
                - generic [ref=e587]: 🪔
                - button "🔄 बदला" [ref=e588] [cursor=pointer]
            - cell "भरणी श्राद्ध bharani-shraddha" [ref=e589]:
              - strong [ref=e590]: भरणी श्राद्ध
              - text: bharani-shraddha
            - cell "पित्रुश्राद्ध" [ref=e591]
            - cell "₹४,८६१" [ref=e592]:
              - strong [ref=e593]: ₹४,८६१
            - cell "3 तास" [ref=e594]
            - cell "☆ नाही" [ref=e595]:
              - button "☆ नाही" [ref=e596] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e597]:
              - generic:
                - button "✏️ संपादित" [ref=e598] [cursor=pointer]
                - button "₹ किंमत" [ref=e599] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e600] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e601] [cursor=pointer]
                - button "🗑️ काढा" [ref=e602] [cursor=pointer]
          - row "🪔 🔄 बदला त्रिपिंडी श्राद्ध tripindi-shraddha पित्रुश्राद्ध ₹७,०८० 4 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e603]:
            - cell "🪔 🔄 बदला" [ref=e604]:
              - generic [ref=e605]:
                - generic [ref=e607]: 🪔
                - button "🔄 बदला" [ref=e608] [cursor=pointer]
            - cell "त्रिपिंडी श्राद्ध tripindi-shraddha" [ref=e609]:
              - strong [ref=e610]: त्रिपिंडी श्राद्ध
              - text: tripindi-shraddha
            - cell "पित्रुश्राद्ध" [ref=e611]
            - cell "₹७,०८०" [ref=e612]:
              - strong [ref=e613]: ₹७,०८०
            - cell "4 तास" [ref=e614]
            - cell "☆ नाही" [ref=e615]:
              - button "☆ नाही" [ref=e616] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e617]:
              - generic:
                - button "✏️ संपादित" [ref=e618] [cursor=pointer]
                - button "₹ किंमत" [ref=e619] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e620] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e621] [cursor=pointer]
                - button "🗑️ काढा" [ref=e622] [cursor=pointer]
          - row "🪔 🔄 बदला गणपती विसर्जन पूजा ganpati-visarjan उत्सव पूजा ₹४,८६२ 2 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e623]:
            - cell "🪔 🔄 बदला" [ref=e624]:
              - generic [ref=e625]:
                - generic [ref=e627]: 🪔
                - button "🔄 बदला" [ref=e628] [cursor=pointer]
            - cell "गणपती विसर्जन पूजा ganpati-visarjan" [ref=e629]:
              - strong [ref=e630]: गणपती विसर्जन पूजा
              - text: ganpati-visarjan
            - cell "उत्सव पूजा" [ref=e631]
            - cell "₹४,८६२" [ref=e632]:
              - strong [ref=e633]: ₹४,८६२
            - cell "2 तास" [ref=e634]
            - cell "☆ नाही" [ref=e635]:
              - button "☆ नाही" [ref=e636] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e637]:
              - generic:
                - button "✏️ संपादित" [ref=e638] [cursor=pointer]
                - button "₹ किंमत" [ref=e639] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e640] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e641] [cursor=pointer]
                - button "🗑️ काढा" [ref=e642] [cursor=pointer]
          - row "🪔 🔄 बदला कृष्ण जन्माष्टमी krishna-janmashtami उत्सव पूजा ₹३,६८२ 2 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e643]:
            - cell "🪔 🔄 बदला" [ref=e644]:
              - generic [ref=e645]:
                - generic [ref=e647]: 🪔
                - button "🔄 बदला" [ref=e648] [cursor=pointer]
            - cell "कृष्ण जन्माष्टमी krishna-janmashtami" [ref=e649]:
              - strong [ref=e650]: कृष्ण जन्माष्टमी
              - text: krishna-janmashtami
            - cell "उत्सव पूजा" [ref=e651]
            - cell "₹३,६८२" [ref=e652]:
              - strong [ref=e653]: ₹३,६८२
            - cell "2 तास" [ref=e654]
            - cell "☆ नाही" [ref=e655]:
              - button "☆ नाही" [ref=e656] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e657]:
              - generic:
                - button "✏️ संपादित" [ref=e658] [cursor=pointer]
                - button "₹ किंमत" [ref=e659] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e660] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e661] [cursor=pointer]
                - button "🗑️ काढा" [ref=e662] [cursor=pointer]
          - row "🪔 🔄 बदला नवरात्री घटस्थापना navratri-ghatasthapana उत्सव पूजा ₹४,८६२ 2.5 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e663]:
            - cell "🪔 🔄 बदला" [ref=e664]:
              - generic [ref=e665]:
                - generic [ref=e667]: 🪔
                - button "🔄 बदला" [ref=e668] [cursor=pointer]
            - cell "नवरात्री घटस्थापना navratri-ghatasthapana" [ref=e669]:
              - strong [ref=e670]: नवरात्री घटस्थापना
              - text: navratri-ghatasthapana
            - cell "उत्सव पूजा" [ref=e671]
            - cell "₹४,८६२" [ref=e672]:
              - strong [ref=e673]: ₹४,८६२
            - cell "2.5 तास" [ref=e674]
            - cell "☆ नाही" [ref=e675]:
              - button "☆ नाही" [ref=e676] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e677]:
              - generic:
                - button "✏️ संपादित" [ref=e678] [cursor=pointer]
                - button "₹ किंमत" [ref=e679] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e680] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e681] [cursor=pointer]
                - button "🗑️ काढा" [ref=e682] [cursor=pointer]
          - row "🪔 🔄 बदला होळी पूजन holi-poojan उत्सव पूजा ₹२,९७४ 1 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e683]:
            - cell "🪔 🔄 बदला" [ref=e684]:
              - generic [ref=e685]:
                - generic [ref=e687]: 🪔
                - button "🔄 बदला" [ref=e688] [cursor=pointer]
            - cell "होळी पूजन holi-poojan" [ref=e689]:
              - strong [ref=e690]: होळी पूजन
              - text: holi-poojan
            - cell "उत्सव पूजा" [ref=e691]
            - cell "₹२,९७४" [ref=e692]:
              - strong [ref=e693]: ₹२,९७४
            - cell "1 तास" [ref=e694]
            - cell "☆ नाही" [ref=e695]:
              - button "☆ नाही" [ref=e696] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e697]:
              - generic:
                - button "✏️ संपादित" [ref=e698] [cursor=pointer]
                - button "₹ किंमत" [ref=e699] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e700] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e701] [cursor=pointer]
                - button "🗑️ काढा" [ref=e702] [cursor=pointer]
          - row "🪔 🔄 बदला तुळशी विवाह tulsi-vivah उत्सव पूजा ₹४,८६२ 2 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e703]:
            - cell "🪔 🔄 बदला" [ref=e704]:
              - generic [ref=e705]:
                - generic [ref=e707]: 🪔
                - button "🔄 बदला" [ref=e708] [cursor=pointer]
            - cell "तुळशी विवाह tulsi-vivah" [ref=e709]:
              - strong [ref=e710]: तुळशी विवाह
              - text: tulsi-vivah
            - cell "उत्सव पूजा" [ref=e711]
            - cell "₹४,८६२" [ref=e712]:
              - strong [ref=e713]: ₹४,८६२
            - cell "2 तास" [ref=e714]
            - cell "☆ नाही" [ref=e715]:
              - button "☆ नाही" [ref=e716] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e717]:
              - generic:
                - button "✏️ संपादित" [ref=e718] [cursor=pointer]
                - button "₹ किंमत" [ref=e719] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e720] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e721] [cursor=pointer]
                - button "🗑️ काढा" [ref=e722] [cursor=pointer]
          - row "भूमिपूजन 🔄 बदला भूमिपूजन bhoomi-pujan वास्तू पूजा ₹५,०९८ 2 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e723]:
            - cell "भूमिपूजन 🔄 बदला" [ref=e724]:
              - generic [ref=e725]:
                - img "भूमिपूजन" [ref=e727]
                - button "🔄 बदला" [ref=e728] [cursor=pointer]
            - cell "भूमिपूजन bhoomi-pujan" [ref=e729]:
              - strong [ref=e730]: भूमिपूजन
              - text: bhoomi-pujan
            - cell "वास्तू पूजा" [ref=e731]
            - cell "₹५,०९८" [ref=e732]:
              - strong [ref=e733]: ₹५,०९८
            - cell "2 तास" [ref=e734]
            - cell "☆ नाही" [ref=e735]:
              - button "☆ नाही" [ref=e736] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e737]:
              - generic:
                - button "✏️ संपादित" [ref=e738] [cursor=pointer]
                - button "₹ किंमत" [ref=e739] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e740] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e741] [cursor=pointer]
                - button "🗑️ काढा" [ref=e742] [cursor=pointer]
          - row "🪔 🔄 बदला कार्यालय शुभारंभ पूजा office-shubharambh वास्तू पूजा ₹६,३७२ 2.5 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e743]:
            - cell "🪔 🔄 बदला" [ref=e744]:
              - generic [ref=e745]:
                - generic [ref=e747]: 🪔
                - button "🔄 बदला" [ref=e748] [cursor=pointer]
            - cell "कार्यालय शुभारंभ पूजा office-shubharambh" [ref=e749]:
              - strong [ref=e750]: कार्यालय शुभारंभ पूजा
              - text: office-shubharambh
            - cell "वास्तू पूजा" [ref=e751]
            - cell "₹६,३७२" [ref=e752]:
              - strong [ref=e753]: ₹६,३७२
            - cell "2.5 तास" [ref=e754]
            - cell "☆ नाही" [ref=e755]:
              - button "☆ नाही" [ref=e756] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e757]:
              - generic:
                - button "✏️ संपादित" [ref=e758] [cursor=pointer]
                - button "₹ किंमत" [ref=e759] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e760] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e761] [cursor=pointer]
                - button "🗑️ काढा" [ref=e762] [cursor=pointer]
          - row "वास्तूशांती व उदक शुद्धी 🔄 बदला वास्तूशांती व उदक शुद्धी vastu-shanti-udak वास्तू पूजा ₹१८,४९९ 5 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e763]:
            - cell "वास्तूशांती व उदक शुद्धी 🔄 बदला" [ref=e764]:
              - generic [ref=e765]:
                - img "वास्तूशांती व उदक शुद्धी" [ref=e767]
                - button "🔄 बदला" [ref=e768] [cursor=pointer]
            - cell "वास्तूशांती व उदक शुद्धी vastu-shanti-udak" [ref=e769]:
              - strong [ref=e770]: वास्तूशांती व उदक शुद्धी
              - text: vastu-shanti-udak
            - cell "वास्तू पूजा" [ref=e771]
            - cell "₹१८,४९९" [ref=e772]:
              - strong [ref=e773]: ₹१८,४९९
            - cell "5 तास" [ref=e774]
            - cell "☆ नाही" [ref=e775]:
              - button "☆ नाही" [ref=e776] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e777]:
              - generic:
                - button "✏️ संपादित" [ref=e778] [cursor=pointer]
                - button "₹ किंमत" [ref=e779] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e780] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e781] [cursor=pointer]
                - button "🗑️ काढा" [ref=e782] [cursor=pointer]
          - row "नक्षत्र जनन शांती 🔄 बदला नक्षत्र जनन शांती nakshatra-janan-shanti हवन / जाप ₹४,८०० 3 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e783]:
            - cell "नक्षत्र जनन शांती 🔄 बदला" [ref=e784]:
              - generic [ref=e785]:
                - img "नक्षत्र जनन शांती" [ref=e787]
                - button "🔄 बदला" [ref=e788] [cursor=pointer]
            - cell "नक्षत्र जनन शांती nakshatra-janan-shanti" [ref=e789]:
              - strong [ref=e790]: नक्षत्र जनन शांती
              - text: nakshatra-janan-shanti
            - cell "हवन / जाप" [ref=e791]
            - cell "₹४,८००" [ref=e792]:
              - strong [ref=e793]: ₹४,८००
            - cell "3 तास" [ref=e794]
            - cell "☆ नाही" [ref=e795]:
              - button "☆ नाही" [ref=e796] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e797]:
              - generic:
                - button "✏️ संपादित" [ref=e798] [cursor=pointer]
                - button "₹ किंमत" [ref=e799] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e800] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e801] [cursor=pointer]
                - button "🗑️ काढा" [ref=e802] [cursor=pointer]
          - row "🪔 🔄 बदला लक्ष्मी हवन lakshmi-havan हवन / जाप ₹४,५०० 2.5 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e803]:
            - cell "🪔 🔄 बदला" [ref=e804]:
              - generic [ref=e805]:
                - generic [ref=e807]: 🪔
                - button "🔄 बदला" [ref=e808] [cursor=pointer]
            - cell "लक्ष्मी हवन lakshmi-havan" [ref=e809]:
              - strong [ref=e810]: लक्ष्मी हवन
              - text: lakshmi-havan
            - cell "हवन / जाप" [ref=e811]
            - cell "₹४,५००" [ref=e812]:
              - strong [ref=e813]: ₹४,५००
            - cell "2.5 तास" [ref=e814]
            - cell "☆ नाही" [ref=e815]:
              - button "☆ नाही" [ref=e816] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e817]:
              - generic:
                - button "✏️ संपादित" [ref=e818] [cursor=pointer]
                - button "₹ किंमत" [ref=e819] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e820] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e821] [cursor=pointer]
                - button "🗑️ काढा" [ref=e822] [cursor=pointer]
          - row "🪔 🔄 बदला गायत्री हवन gayatri-havan हवन / जाप ₹४,५०० 2.5 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e823]:
            - cell "🪔 🔄 बदला" [ref=e824]:
              - generic [ref=e825]:
                - generic [ref=e827]: 🪔
                - button "🔄 बदला" [ref=e828] [cursor=pointer]
            - cell "गायत्री हवन gayatri-havan" [ref=e829]:
              - strong [ref=e830]: गायत्री हवन
              - text: gayatri-havan
            - cell "हवन / जाप" [ref=e831]
            - cell "₹४,५००" [ref=e832]:
              - strong [ref=e833]: ₹४,५००
            - cell "2.5 तास" [ref=e834]
            - cell "☆ नाही" [ref=e835]:
              - button "☆ नाही" [ref=e836] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e837]:
              - generic:
                - button "✏️ संपादित" [ref=e838] [cursor=pointer]
                - button "₹ किंमत" [ref=e839] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e840] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e841] [cursor=pointer]
                - button "🗑️ काढा" [ref=e842] [cursor=pointer]
          - row "🪔 🔄 बदला सुदर्शन हवन sudarshana-havan हवन / जाप ₹५,५०० 3 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e843]:
            - cell "🪔 🔄 बदला" [ref=e844]:
              - generic [ref=e845]:
                - generic [ref=e847]: 🪔
                - button "🔄 बदला" [ref=e848] [cursor=pointer]
            - cell "सुदर्शन हवन sudarshana-havan" [ref=e849]:
              - strong [ref=e850]: सुदर्शन हवन
              - text: sudarshana-havan
            - cell "हवन / जाप" [ref=e851]
            - cell "₹५,५००" [ref=e852]:
              - strong [ref=e853]: ₹५,५००
            - cell "3 तास" [ref=e854]
            - cell "☆ नाही" [ref=e855]:
              - button "☆ नाही" [ref=e856] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e857]:
              - generic:
                - button "✏️ संपादित" [ref=e858] [cursor=pointer]
                - button "₹ किंमत" [ref=e859] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e860] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e861] [cursor=pointer]
                - button "🗑️ काढा" [ref=e862] [cursor=pointer]
          - row "🪔 🔄 बदला चंडी हवन chandi-havan हवन / जाप ₹६,००० 4 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e863]:
            - cell "🪔 🔄 बदला" [ref=e864]:
              - generic [ref=e865]:
                - generic [ref=e867]: 🪔
                - button "🔄 बदला" [ref=e868] [cursor=pointer]
            - cell "चंडी हवन chandi-havan" [ref=e869]:
              - strong [ref=e870]: चंडी हवन
              - text: chandi-havan
            - cell "हवन / जाप" [ref=e871]
            - cell "₹६,०००" [ref=e872]:
              - strong [ref=e873]: ₹६,०००
            - cell "4 तास" [ref=e874]
            - cell "☆ नाही" [ref=e875]:
              - button "☆ नाही" [ref=e876] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e877]:
              - generic:
                - button "✏️ संपादित" [ref=e878] [cursor=pointer]
                - button "₹ किंमत" [ref=e879] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e880] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e881] [cursor=pointer]
                - button "🗑️ काढा" [ref=e882] [cursor=pointer]
          - row "🪔 🔄 बदला महारुद्र हवन maha-rudra-havan हवन / जाप ₹७,५०० 5 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e883]:
            - cell "🪔 🔄 बदला" [ref=e884]:
              - generic [ref=e885]:
                - generic [ref=e887]: 🪔
                - button "🔄 बदला" [ref=e888] [cursor=pointer]
            - cell "महारुद्र हवन maha-rudra-havan" [ref=e889]:
              - strong [ref=e890]: महारुद्र हवन
              - text: maha-rudra-havan
            - cell "हवन / जाप" [ref=e891]
            - cell "₹७,५००" [ref=e892]:
              - strong [ref=e893]: ₹७,५००
            - cell "5 तास" [ref=e894]
            - cell "☆ नाही" [ref=e895]:
              - button "☆ नाही" [ref=e896] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e897]:
              - generic:
                - button "✏️ संपादित" [ref=e898] [cursor=pointer]
                - button "₹ किंमत" [ref=e899] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e900] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e901] [cursor=pointer]
                - button "🗑️ काढा" [ref=e902] [cursor=pointer]
          - row "🪔 🔄 बदला स्वयंवर पार्वती हवन swayamvara-parvati-havan हवन / जाप ₹५,००० 3 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e903]:
            - cell "🪔 🔄 बदला" [ref=e904]:
              - generic [ref=e905]:
                - generic [ref=e907]: 🪔
                - button "🔄 बदला" [ref=e908] [cursor=pointer]
            - cell "स्वयंवर पार्वती हवन swayamvara-parvati-havan" [ref=e909]:
              - strong [ref=e910]: स्वयंवर पार्वती हवन
              - text: swayamvara-parvati-havan
            - cell "हवन / जाप" [ref=e911]
            - cell "₹५,०००" [ref=e912]:
              - strong [ref=e913]: ₹५,०००
            - cell "3 तास" [ref=e914]
            - cell "☆ नाही" [ref=e915]:
              - button "☆ नाही" [ref=e916] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e917]:
              - generic:
                - button "✏️ संपादित" [ref=e918] [cursor=pointer]
                - button "₹ किंमत" [ref=e919] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e920] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e921] [cursor=pointer]
                - button "🗑️ काढा" [ref=e922] [cursor=pointer]
          - row "🪔 🔄 बदला कुबेर हवन kuber-havan हवन / जाप ₹५,००० 3 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e923]:
            - cell "🪔 🔄 बदला" [ref=e924]:
              - generic [ref=e925]:
                - generic [ref=e927]: 🪔
                - button "🔄 बदला" [ref=e928] [cursor=pointer]
            - cell "कुबेर हवन kuber-havan" [ref=e929]:
              - strong [ref=e930]: कुबेर हवन
              - text: kuber-havan
            - cell "हवन / जाप" [ref=e931]
            - cell "₹५,०००" [ref=e932]:
              - strong [ref=e933]: ₹५,०००
            - cell "3 तास" [ref=e934]
            - cell "☆ नाही" [ref=e935]:
              - button "☆ नाही" [ref=e936] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e937]:
              - generic:
                - button "✏️ संपादित" [ref=e938] [cursor=pointer]
                - button "₹ किंमत" [ref=e939] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e940] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e941] [cursor=pointer]
                - button "🗑️ काढा" [ref=e942] [cursor=pointer]
          - row "🪔 🔄 बदला काल भैरव हवन kaal-bhairav-havan हवन / जाप ₹५,५०० 3 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e943]:
            - cell "🪔 🔄 बदला" [ref=e944]:
              - generic [ref=e945]:
                - generic [ref=e947]: 🪔
                - button "🔄 बदला" [ref=e948] [cursor=pointer]
            - cell "काल भैरव हवन kaal-bhairav-havan" [ref=e949]:
              - strong [ref=e950]: काल भैरव हवन
              - text: kaal-bhairav-havan
            - cell "हवन / जाप" [ref=e951]
            - cell "₹५,५००" [ref=e952]:
              - strong [ref=e953]: ₹५,५००
            - cell "3 तास" [ref=e954]
            - cell "☆ नाही" [ref=e955]:
              - button "☆ नाही" [ref=e956] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e957]:
              - generic:
                - button "✏️ संपादित" [ref=e958] [cursor=pointer]
                - button "₹ किंमत" [ref=e959] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e960] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e961] [cursor=pointer]
                - button "🗑️ काढा" [ref=e962] [cursor=pointer]
          - row "🪔 🔄 बदला लघुरुद्र हवन laghu-rudra-havan हवन / जाप ₹६,५०० 4 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e963]:
            - cell "🪔 🔄 बदला" [ref=e964]:
              - generic [ref=e965]:
                - generic [ref=e967]: 🪔
                - button "🔄 बदला" [ref=e968] [cursor=pointer]
            - cell "लघुरुद्र हवन laghu-rudra-havan" [ref=e969]:
              - strong [ref=e970]: लघुरुद्र हवन
              - text: laghu-rudra-havan
            - cell "हवन / जाप" [ref=e971]
            - cell "₹६,५००" [ref=e972]:
              - strong [ref=e973]: ₹६,५००
            - cell "4 तास" [ref=e974]
            - cell "☆ नाही" [ref=e975]:
              - button "☆ नाही" [ref=e976] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e977]:
              - generic:
                - button "✏️ संपादित" [ref=e978] [cursor=pointer]
                - button "₹ किंमत" [ref=e979] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e980] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e981] [cursor=pointer]
                - button "🗑️ काढा" [ref=e982] [cursor=pointer]
          - row "🪔 🔄 बदला श्री सूक्त हवन shri-sukta-havan हवन / जाप ₹४,५०० 2.5 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e983]:
            - cell "🪔 🔄 बदला" [ref=e984]:
              - generic [ref=e985]:
                - generic [ref=e987]: 🪔
                - button "🔄 बदला" [ref=e988] [cursor=pointer]
            - cell "श्री सूक्त हवन shri-sukta-havan" [ref=e989]:
              - strong [ref=e990]: श्री सूक्त हवन
              - text: shri-sukta-havan
            - cell "हवन / जाप" [ref=e991]
            - cell "₹४,५००" [ref=e992]:
              - strong [ref=e993]: ₹४,५००
            - cell "2.5 तास" [ref=e994]
            - cell "☆ नाही" [ref=e995]:
              - button "☆ नाही" [ref=e996] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e997]:
              - generic:
                - button "✏️ संपादित" [ref=e998] [cursor=pointer]
                - button "₹ किंमत" [ref=e999] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e1000] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e1001] [cursor=pointer]
                - button "🗑️ काढा" [ref=e1002] [cursor=pointer]
          - row "🪔 🔄 बदला पुरुष सूक्त हवन purusha-sukta-havan हवन / जाप ₹४,५०० 2.5 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e1003]:
            - cell "🪔 🔄 बदला" [ref=e1004]:
              - generic [ref=e1005]:
                - generic [ref=e1007]: 🪔
                - button "🔄 बदला" [ref=e1008] [cursor=pointer]
            - cell "पुरुष सूक्त हवन purusha-sukta-havan" [ref=e1009]:
              - strong [ref=e1010]: पुरुष सूक्त हवन
              - text: purusha-sukta-havan
            - cell "हवन / जाप" [ref=e1011]
            - cell "₹४,५००" [ref=e1012]:
              - strong [ref=e1013]: ₹४,५००
            - cell "2.5 तास" [ref=e1014]
            - cell "☆ नाही" [ref=e1015]:
              - button "☆ नाही" [ref=e1016] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e1017]:
              - generic:
                - button "✏️ संपादित" [ref=e1018] [cursor=pointer]
                - button "₹ किंमत" [ref=e1019] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e1020] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e1021] [cursor=pointer]
                - button "🗑️ काढा" [ref=e1022] [cursor=pointer]
          - row "🪔 🔄 बदला गर्भाधान संस्कार garbhadhana-sanskar गृह पूजा ₹३,५०० 1.5 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e1023]:
            - cell "🪔 🔄 बदला" [ref=e1024]:
              - generic [ref=e1025]:
                - generic [ref=e1027]: 🪔
                - button "🔄 बदला" [ref=e1028] [cursor=pointer]
            - cell "गर्भाधान संस्कार garbhadhana-sanskar" [ref=e1029]:
              - strong [ref=e1030]: गर्भाधान संस्कार
              - text: garbhadhana-sanskar
            - cell "गृह पूजा" [ref=e1031]
            - cell "₹३,५००" [ref=e1032]:
              - strong [ref=e1033]: ₹३,५००
            - cell "1.5 तास" [ref=e1034]
            - cell "☆ नाही" [ref=e1035]:
              - button "☆ नाही" [ref=e1036] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e1037]:
              - generic:
                - button "✏️ संपादित" [ref=e1038] [cursor=pointer]
                - button "₹ किंमत" [ref=e1039] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e1040] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e1041] [cursor=pointer]
                - button "🗑️ काढा" [ref=e1042] [cursor=pointer]
          - row "🪔 🔄 बदला पुंसवन संस्कार pumsavana-sanskar गृह पूजा ₹३,००० 1.5 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e1043]:
            - cell "🪔 🔄 बदला" [ref=e1044]:
              - generic [ref=e1045]:
                - generic [ref=e1047]: 🪔
                - button "🔄 बदला" [ref=e1048] [cursor=pointer]
            - cell "पुंसवन संस्कार pumsavana-sanskar" [ref=e1049]:
              - strong [ref=e1050]: पुंसवन संस्कार
              - text: pumsavana-sanskar
            - cell "गृह पूजा" [ref=e1051]
            - cell "₹३,०००" [ref=e1052]:
              - strong [ref=e1053]: ₹३,०००
            - cell "1.5 तास" [ref=e1054]
            - cell "☆ नाही" [ref=e1055]:
              - button "☆ नाही" [ref=e1056] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e1057]:
              - generic:
                - button "✏️ संपादित" [ref=e1058] [cursor=pointer]
                - button "₹ किंमत" [ref=e1059] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e1060] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e1061] [cursor=pointer]
                - button "🗑️ काढा" [ref=e1062] [cursor=pointer]
          - row "🪔 🔄 बदला सीमंतोन्नयन संस्कार simantonnayana-sanskar गृह पूजा ₹३,५०० 2 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e1063]:
            - cell "🪔 🔄 बदला" [ref=e1064]:
              - generic [ref=e1065]:
                - generic [ref=e1067]: 🪔
                - button "🔄 बदला" [ref=e1068] [cursor=pointer]
            - cell "सीमंतोन्नयन संस्कार simantonnayana-sanskar" [ref=e1069]:
              - strong [ref=e1070]: सीमंतोन्नयन संस्कार
              - text: simantonnayana-sanskar
            - cell "गृह पूजा" [ref=e1071]
            - cell "₹३,५००" [ref=e1072]:
              - strong [ref=e1073]: ₹३,५००
            - cell "2 तास" [ref=e1074]
            - cell "☆ नाही" [ref=e1075]:
              - button "☆ नाही" [ref=e1076] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e1077]:
              - generic:
                - button "✏️ संपादित" [ref=e1078] [cursor=pointer]
                - button "₹ किंमत" [ref=e1079] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e1080] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e1081] [cursor=pointer]
                - button "🗑️ काढा" [ref=e1082] [cursor=pointer]
          - row "🪔 🔄 बदला जातकर्म संस्कार jatakarma-sanskar गृह पूजा ₹३,००० 1.5 तास ☆ नाही ✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e1083]:
            - cell "🪔 🔄 बदला" [ref=e1084]:
              - generic [ref=e1085]:
                - generic [ref=e1087]: 🪔
                - button "🔄 बदला" [ref=e1088] [cursor=pointer]
            - cell "जातकर्म संस्कार jatakarma-sanskar" [ref=e1089]:
              - strong [ref=e1090]: जातकर्म संस्कार
              - text: jatakarma-sanskar
            - cell "गृह पूजा" [ref=e1091]
            - cell "₹३,०००" [ref=e1092]:
              - strong [ref=e1093]: ₹३,०००
            - cell "1.5 तास" [ref=e1094]
            - cell "☆ नाही" [ref=e1095]:
              - button "☆ नाही" [ref=e1096] [cursor=pointer]
            - cell "✏️ संपादित ₹ किंमत ⏱️ कालावधी 📿 विधी चरण 🗑️ काढा" [ref=e1097]:
              - generic:
                - button "✏️ संपादित" [ref=e1098] [cursor=pointer]
                - button "₹ किंमत" [ref=e1099] [cursor=pointer]
                - button "⏱️ कालावधी" [ref=e1100] [cursor=pointer]
                - button "📿 विधी चरण" [ref=e1101] [cursor=pointer]
                - button "🗑️ काढा" [ref=e1102] [cursor=pointer]
```

# Test source

```ts
  316 |     await rows.first().locator('button:has-text("कालावधी")').click();
  317 |     await page.waitForTimeout(300);
  318 |     const durCell = rows.first().locator('td').nth(4);
  319 |     await expect(durCell.locator('text=तास')).toBeVisible();
  320 |   });
  321 | 
  322 |   test('TC-DE-10: starting price edit while duration edit is active cancels duration', async ({ page }) => {
  323 |     await adminLogin(page);
  324 |     await gotoPoojas(page);
  325 |     const rows = page.locator('tbody tr');
  326 |     if (await rows.count() < 2) return test.skip();
  327 |     // Start duration edit on first row
  328 |     await rows.first().locator('button:has-text("कालावधी")').click();
  329 |     await page.waitForTimeout(300);
  330 |     const durInput = rows.first().locator('td').nth(4).locator('input[type="number"]');
  331 |     await expect(durInput).toBeVisible();
  332 |     // Cancel duration edit
  333 |     await page.locator('button:has-text("✕")').click();
  334 |     await page.waitForTimeout(200);
  335 |     // Now price edit on second row should work fine
  336 |     await rows.nth(1).locator('button:has-text("किंमत")').click();
  337 |     await page.waitForTimeout(300);
  338 |     await expect(rows.nth(1).locator('td').nth(3).locator('input[type="number"]')).toBeVisible({ timeout: 3000 });
  339 |   });
  340 | });
  341 | 
  342 | // ═══════════════════════════════════════════════════════════════════
  343 | // SECTIONS 4-5 — Add + Delete: run serially to avoid race condition
  344 | // (TC-AP-05 creates test data that TC-DP-01 then deletes)
  345 | // ═══════════════════════════════════════════════════════════════════
  346 | 
  347 | test.describe('Pooja CRUD Flow', () => {
  348 | test.describe.configure({ mode: 'serial' });
  349 | 
  350 | // Clean all leftover test poojas before running Add/Delete tests
  351 | test.beforeAll(async ({ request }) => {
  352 |   const loginRes = await request.post(`${API_URL}/auth/login`, {
  353 |     data: { phone: ADMIN_PHONE, password: ADMIN_PASSWORD },
  354 |   });
  355 |   if (!loginRes.ok()) return;
  356 |   const token = (await loginRes.json()).data?.token;
  357 |   if (!token) return;
  358 |   // Fetch all poojas and soft-delete any named like the test pooja
  359 |   const listRes = await request.get(`${API_URL}/poojas?limit=100`, {
  360 |     headers: { Authorization: `Bearer ${token}` },
  361 |   });
  362 |   if (!listRes.ok()) return;
  363 |   const body = await listRes.json();
  364 |   const testPoojas = (body.data?.poojas || []).filter(p => p.name_mr === TEST_POOJA.name_mr);
  365 |   for (const p of testPoojas) {
  366 |     await request.delete(`${API_URL}/poojas/${p.id}`, {
  367 |       headers: { Authorization: `Bearer ${token}` },
  368 |     });
  369 |   }
  370 | });
  371 | 
  372 | test.describe('Manage Poojas — Add Pooja Form', () => {
  373 | 
  374 |   test('TC-AP-01: form requires category, name_mr, slug, price', async ({ page }) => {
  375 |     await adminLogin(page);
  376 |     await gotoPoojas(page);
  377 |     await page.locator('button:has-text("नवीन पूजा जोडा")').click();
  378 |     await page.waitForTimeout(400);
  379 |     // Click submit without filling anything
  380 |     await page.locator('button:has-text("पूजा जोडा")').click();
  381 |     await page.waitForTimeout(500);
  382 |     // Should stay on the form (validation toast shown)
  383 |     await expect(page.locator('h2:has-text("नवीन पूजा जोडा")')).toBeVisible();
  384 |   });
  385 | 
  386 |   test('TC-AP-02: form auto-fills slug from Marathi name', async ({ page }) => {
  387 |     await adminLogin(page);
  388 |     await gotoPoojas(page);
  389 |     await page.locator('button:has-text("नवीन पूजा जोडा")').click();
  390 |     await page.waitForTimeout(400);
  391 |     await page.locator('input[name="name_mr"]').fill('Test Pooja Name');
  392 |     await page.waitForTimeout(200);
  393 |     const slug = await page.locator('input[name="slug"]').inputValue();
  394 |     expect(slug).toContain('test');
  395 |   });
  396 | 
  397 |   test('TC-AP-03: form has duration input with step 0.5', async ({ page }) => {
  398 |     await adminLogin(page);
  399 |     await gotoPoojas(page);
  400 |     await page.locator('button:has-text("नवीन पूजा जोडा")').click();
  401 |     await page.waitForTimeout(400);
  402 |     const dur = page.locator('input[name="duration_hrs"]');
  403 |     await expect(dur).toBeVisible();
  404 |     await expect(dur).toHaveAttribute('step', '0.5');
  405 |     // Default value should be 2
  406 |     const val = await dur.inputValue();
  407 |     expect(parseFloat(val)).toBe(2);
  408 |   });
  409 | 
  410 |   test('TC-AP-04: रद्द करा resets and hides the form', async ({ page }) => {
  411 |     await adminLogin(page);
  412 |     await gotoPoojas(page);
  413 |     await page.locator('button:has-text("नवीन पूजा जोडा")').click();
  414 |     await page.waitForTimeout(400);
  415 |     await page.locator('input[name="name_mr"]').fill('Some Test Input');
> 416 |     await page.locator('button:has-text("रद्द करा")').click();
      |                                                       ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  417 |     await page.waitForTimeout(300);
  418 |     await expect(page.locator('h2:has-text("नवीन पूजा जोडा")')).toHaveCount(0);
  419 |   });
  420 | 
  421 |   test('TC-AP-05: creating pooja adds it to the table', async ({ page }) => {
  422 |     await adminLogin(page);
  423 |     await gotoPoojas(page);
  424 |     await page.locator('button:has-text("नवीन पूजा जोडा")').click();
  425 |     await page.waitForTimeout(400);
  426 | 
  427 |     // Select first available category
  428 |     const categorySelect = page.locator('select[name="category_id"]');
  429 |     const options = await categorySelect.locator('option').count();
  430 |     if (options < 2) return test.skip();
  431 |     await categorySelect.selectOption({ index: 1 });
  432 | 
  433 |     await page.locator('input[name="name_mr"]').fill(TEST_POOJA.name_mr);
  434 |     await page.waitForTimeout(200); // let slug auto-fill
  435 |     await page.locator('input[name="price"]').fill(TEST_POOJA.price);
  436 |     await page.locator('input[name="duration_hrs"]').fill(TEST_POOJA.dur);
  437 | 
  438 |     await page.locator('button:has-text("पूजा जोडा")').click();
  439 |     await waitForLoad(page);
  440 |     await page.waitForTimeout(1000);
  441 | 
  442 |     // Form closes on success — this verifies the API call succeeded
  443 |     // (TC-DP-01 may concurrently delete the row, so we only assert form closure)
  444 |     await expect(page.locator('h2:has-text("नवीन पूजा जोडा")')).toHaveCount(0, { timeout: 8000 });
  445 |   });
  446 | });
  447 | 
  448 | // ═══════════════════════════════════════════════════════════════════
  449 | // SECTION 5 — Delete Pooja
  450 | // ═══════════════════════════════════════════════════════════════════
  451 | 
  452 | test.describe('Manage Poojas — Delete', () => {
  453 | 
  454 |   test('TC-DP-01: delete removes pooja from table', async ({ page }) => {
  455 |     await adminLogin(page);
  456 |     await gotoPoojas(page);
  457 |     const testRow = page.locator(`tr:has(td:has-text("${TEST_POOJA.name_mr}"))`);
  458 |     if (await testRow.count() === 0) return test.skip();
  459 |     page.on('dialog', d => d.accept());
  460 |     await testRow.locator('button:has-text("काढा")').click();
  461 |     await page.waitForTimeout(2000);
  462 |     await expect(page.locator(`td:has-text("${TEST_POOJA.name_mr}")`)).toHaveCount(0, { timeout: 6000 });
  463 |   });
  464 | 
  465 |   test('TC-DP-02: delete confirmation dialog appears', async ({ page }) => {
  466 |     await adminLogin(page);
  467 |     await gotoPoojas(page);
  468 |     const rows = page.locator('tbody tr');
  469 |     if (await rows.count() === 0) return test.skip();
  470 |     let dialogShown = false;
  471 |     page.on('dialog', async d => { dialogShown = true; await d.dismiss(); });
  472 |     await rows.first().locator('button:has-text("काढा")').click();
  473 |     await page.waitForTimeout(500);
  474 |     expect(dialogShown).toBe(true);
  475 |   });
  476 | 
  477 |   test('TC-DP-03: dismissing confirmation keeps pooja in table', async ({ page }) => {
  478 |     await adminLogin(page);
  479 |     await gotoPoojas(page);
  480 |     const rows = page.locator('tbody tr');
  481 |     const countBefore = await rows.count();
  482 |     if (countBefore === 0) return test.skip();
  483 |     page.on('dialog', d => d.dismiss());
  484 |     await rows.first().locator('button:has-text("काढा")').click();
  485 |     await page.waitForTimeout(800);
  486 |     const countAfter = await rows.count();
  487 |     expect(countAfter).toBe(countBefore);
  488 |   });
  489 | });
  490 | 
  491 | }); // end Pooja CRUD Flow
  492 | 
  493 | // ═══════════════════════════════════════════════════════════════════
  494 | // SECTION 6 — Pooja API Endpoints
  495 | // ═══════════════════════════════════════════════════════════════════
  496 | 
  497 | test.describe('Poojas API — Endpoints', () => {
  498 | 
  499 |   let adminToken = '';
  500 |   let firstPoojaId = null;
  501 | 
  502 |   test.beforeAll(async ({ request }) => {
  503 |     const res = await request.post(`${API_URL}/auth/login`, {
  504 |       data: { phone: ADMIN_PHONE, password: ADMIN_PASSWORD },
  505 |     });
  506 |     if (res.ok()) {
  507 |       const body = await res.json();
  508 |       adminToken = body.data?.token || '';
  509 |     }
  510 |     const pRes = await request.get(`${API_URL}/poojas`);
  511 |     if (pRes.ok()) {
  512 |       const pBody = await pRes.json();
  513 |       firstPoojaId = pBody.data?.poojas?.[0]?.id || null;
  514 |     }
  515 |   });
  516 | 
```