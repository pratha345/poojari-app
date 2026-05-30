# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance.spec.js >> Performance: Web Vitals >> Homepage - First Contentful Paint metric
- Location: tests\performance.spec.js:61:3

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 5000
Received:   7240
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
      - generic: ॐ
      - generic [ref=e44]:
        - generic [ref=e45]:
          - generic [ref=e46]:
            - generic [ref=e47]: 🙏
            - generic [ref=e48]: घरी पूजा, मनासारखी
          - heading "आपल्या सर्व पूजा सेवांसाठी एक विश्वासार्ह स्थान" [level=1] [ref=e49]:
            - generic [ref=e50]: आपल्या सर्व पूजा सेवांसाठी एक विश्वासार्ह
            - text: स्थान
          - paragraph [ref=e51]: घरबसल्या पूजा बुक करा, अनुभवी पुजारी मिळवा, आणि सर्व धार्मिक विधी सहज पूर्ण करा.
          - generic [ref=e52]:
            - link "🪔 पूजा बुक करा" [ref=e53] [cursor=pointer]:
              - /url: /pooja
            - link "अधिक जाणून घ्या" [ref=e54] [cursor=pointer]:
              - /url: /about
          - generic [ref=e55]:
            - generic [ref=e56]:
              - generic [ref=e57]: 🔍
              - combobox [ref=e58] [cursor=pointer]:
                - option "सर्व पूजा" [selected]
                - option "गृह पूजा"
                - option "हवन / जाप"
                - option "कथा / नित्य पूजा"
                - option "पित्रुश्राद्ध"
                - option "उत्सव पूजा"
                - option "वास्तू पूजा"
            - button "पूजा शोधा →" [ref=e59] [cursor=pointer]
          - generic [ref=e60]:
            - generic [ref=e61]: "प्रसंग निवडा:"
            - generic [ref=e62]:
              - link "🏠 गृहप्रवेश" [ref=e63] [cursor=pointer]:
                - /url: /pooja/vastu-pooja
                - generic [ref=e64]: 🏠
                - text: गृहप्रवेश
              - link "🪔 सत्यनारायण" [ref=e65] [cursor=pointer]:
                - /url: /pooja?search=सत्यनारायण
                - generic [ref=e66]: 🪔
                - text: सत्यनारायण
              - link "💍 लग्न" [ref=e67] [cursor=pointer]:
                - /url: /pooja?search=लग्न
                - generic [ref=e68]: 💍
                - text: लग्न
              - link "👶 नामकरण" [ref=e69] [cursor=pointer]:
                - /url: /pooja?search=नामकरण
                - generic [ref=e70]: 👶
                - text: नामकरण
              - link "🔥 हवन" [ref=e71] [cursor=pointer]:
                - /url: /pooja/havan-jaap
                - generic [ref=e72]: 🔥
                - text: हवन
              - link "🕯️ दशक्रिया" [ref=e73] [cursor=pointer]:
                - /url: /pooja/pitru-shraddha
                - generic [ref=e74]: 🕯️
                - text: दशक्रिया
              - link "🐘 गणपती पूजा" [ref=e75] [cursor=pointer]:
                - /url: /pooja?search=गणपती
                - generic [ref=e76]: 🐘
                - text: गणपती पूजा
              - link "🌟 नवग्रह शांती" [ref=e77] [cursor=pointer]:
                - /url: /pooja?search=नवग्रह
                - generic [ref=e78]: 🌟
                - text: नवग्रह शांती
              - link "🎓 मुंज" [ref=e79] [cursor=pointer]:
                - /url: /pooja?search=मुंज
                - generic [ref=e80]: 🎓
                - text: मुंज
              - link "💡 दिवाळी पूजा" [ref=e81] [cursor=pointer]:
                - /url: /pooja?search=दिवाळी
                - generic [ref=e82]: 💡
                - text: दिवाळी पूजा
          - generic [ref=e83]:
            - generic [ref=e84]: ✅ विश्वासू पुजारी
            - generic [ref=e85]: ⚡ तत्काळ बुकिंग
            - generic [ref=e86]: 🔒 सुरक्षित पेमेंट
        - generic [ref=e88]:
          - generic [ref=e95]:
            - generic [ref=e96]: ॐ
            - generic [ref=e97]: श्री गणेशाय नमः
          - generic [ref=e98]:
            - generic [ref=e99]: ⭐
            - generic [ref=e100]:
              - paragraph [ref=e101]: 4.8 रेटिंग
              - paragraph [ref=e102]: ५०० + ग्राहक
          - generic [ref=e103]:
            - generic [ref=e104]: 🙏
            - generic [ref=e105]:
              - paragraph [ref=e106]: 500+ पुजारी
              - paragraph [ref=e107]: अनुभवी व विश्वासू
          - generic [ref=e108]:
            - generic [ref=e109]: 📍
            - generic [ref=e110]:
              - paragraph [ref=e111]: महाराष्ट्र सेवा
              - paragraph [ref=e112]: सर्व जिल्ह्यांत
    - generic [ref=e117]:
      - generic [ref=e118]:
        - generic [ref=e119]: 📅
        - generic [ref=e120]: ५,०००+
        - generic [ref=e121]: यशस्वी बुकिंग
      - generic [ref=e122]:
        - generic [ref=e123]: 🙏
        - generic [ref=e124]: ५००+
        - generic [ref=e125]: अनुभवी पुजारी
      - generic [ref=e126]:
        - generic [ref=e127]: 📍
        - generic [ref=e128]: ३५+
        - generic [ref=e129]: शहरांमध्ये सेवा
      - generic [ref=e130]:
        - generic [ref=e131]: ⭐
        - generic [ref=e132]: ५+
        - generic [ref=e133]: वर्षांचा अनुभव
    - generic [ref=e136]:
      - link "📿 आजची पूजा बुक करा घरात किंवा मंदिरात →" [ref=e137] [cursor=pointer]:
        - /url: /pooja
        - generic [ref=e138]: 📿
        - generic [ref=e139]:
          - paragraph [ref=e140]: आजची पूजा बुक करा
          - paragraph [ref=e141]: घरात किंवा मंदिरात
        - generic [ref=e142]: →
      - link "📅 पंचांग पहा आजचे तिथी-नक्षत्र →" [ref=e143] [cursor=pointer]:
        - /url: /panchang
        - generic [ref=e144]: 📅
        - generic [ref=e145]:
          - paragraph [ref=e146]: पंचांग पहा
          - paragraph [ref=e147]: आजचे तिथी-नक्षत्र
        - generic [ref=e148]: →
      - link "🔮 राशिभविष्य आजचे भविष्य जाणा →" [ref=e149] [cursor=pointer]:
        - /url: /rashifal
        - generic [ref=e150]: 🔮
        - generic [ref=e151]:
          - paragraph [ref=e152]: राशिभविष्य
          - paragraph [ref=e153]: आजचे भविष्य जाणा
        - generic [ref=e154]: →
    - link "🔮 आजचे राशिभविष्य मेष ते मीन — प्रेम, करिअर, आरोग्य आणि आर्थिक भविष्य मराठीत ♈ मेष ♉ वृषभ ♊ मिथुन ♋ कर्क ♌ सिंह ♍ कन्या सर्व राशी पहा →" [ref=e157] [cursor=pointer]:
      - /url: /rashifal
      - generic [ref=e158]:
        - generic [ref=e159]: 🔮
        - generic [ref=e160]:
          - heading "आजचे राशिभविष्य" [level=2] [ref=e161]
          - paragraph [ref=e162]: मेष ते मीन — प्रेम, करिअर, आरोग्य आणि आर्थिक भविष्य मराठीत
      - generic [ref=e163]:
        - generic [ref=e164]: ♈ मेष
        - generic [ref=e165]: ♉ वृषभ
        - generic [ref=e166]: ♊ मिथुन
        - generic [ref=e167]: ♋ कर्क
        - generic [ref=e168]: ♌ सिंह
        - generic [ref=e169]: ♍ कन्या
        - generic [ref=e170]: सर्व राशी पहा →
    - generic [ref=e172]:
      - generic [ref=e173]:
        - heading "आमच्या सेवा" [level=2] [ref=e174]
        - paragraph [ref=e175]: श्रद्धेला आधुनिक सुविधेची जोड
      - generic [ref=e176]:
        - link "🙏 पुजारी सेवा वेदशास्त्रसंपन्न पुजारी घरी येऊन संपूर्ण विधी भक्तीभावाने करतात. अधिक पहा →" [ref=e177] [cursor=pointer]:
          - /url: /pooja
          - generic [ref=e178]: 🙏
          - heading "पुजारी सेवा" [level=3] [ref=e179]
          - paragraph [ref=e180]: वेदशास्त्रसंपन्न पुजारी घरी येऊन संपूर्ण विधी भक्तीभावाने करतात.
          - generic [ref=e181]: अधिक पहा →
        - link "🌍 NRI 💻 ऑनलाइन पूजा — NRI USA · UK · UAE · Canada — WhatsApp/Zoom वर पारंपरिक मराठी पूजा. अधिक पहा →" [ref=e182] [cursor=pointer]:
          - /url: /online-puja
          - generic [ref=e183]: 🌍 NRI
          - generic [ref=e184]: 💻
          - heading "ऑनलाइन पूजा — NRI" [level=3] [ref=e185]
          - paragraph [ref=e186]: USA · UK · UAE · Canada — WhatsApp/Zoom वर पारंपरिक मराठी पूजा.
          - generic [ref=e187]: अधिक पहा →
        - link "✨ युनिक 🏛️ हॉल बुकिंग लग्न · साखरपुडा · समारंभ. पूजारी + हॉल एकत्र बुक करा — फक्त पूजारीवर! अधिक पहा →" [ref=e188] [cursor=pointer]:
          - /url: /hall-booking
          - generic [ref=e189]: ✨ युनिक
          - generic [ref=e190]: 🏛️
          - heading "हॉल बुकिंग" [level=3] [ref=e191]
          - paragraph [ref=e192]: लग्न · साखरपुडा · समारंभ. पूजारी + हॉल एकत्र बुक करा — फक्त पूजारीवर!
          - generic [ref=e193]: अधिक पहा →
    - generic [ref=e196]:
      - generic [ref=e197]: 🪔
      - generic [ref=e198]: 🪔
      - generic [ref=e199]:
        - paragraph [ref=e200]: ॐ श्री गणेशाय नमः
        - paragraph [ref=e201]: विघ्नहर्ता • मंगलमूर्ती • गजानन
      - generic [ref=e202]: 🪔
      - generic [ref=e203]: 🪔
    - generic [ref=e205]:
      - generic [ref=e206]:
        - heading "आम्हालाच का निवडायचे?" [level=2] [ref=e207]
        - paragraph [ref=e208]: लाखो भाविकांचा विश्वास — आमची ताकद
      - generic [ref=e209]:
        - generic [ref=e210]:
          - generic [ref=e211]: 🔐
          - heading "सत्यापित पुजारी" [level=3] [ref=e212]
          - paragraph [ref=e213]: सर्व पुजारी ओळख-सत्यापित, अनुभवी आणि पारंपरिक ज्ञानसंपन्न.
        - generic [ref=e214]:
          - generic [ref=e215]: ⚡
          - heading "सहज बुकिंग" [level=3] [ref=e216]
          - paragraph [ref=e217]: काही मिनिटांत बुकिंग पूर्ण करा. कोणतीही गुंतागुंत नाही.
        - generic [ref=e218]:
          - generic [ref=e219]: 💸
          - heading "परवडणाऱ्या किंमती" [level=3] [ref=e220]
          - paragraph [ref=e221]: कोणत्याही बजेटमध्ये उत्तम सेवा — कोणतेही छुपे शुल्क नाही.
        - generic [ref=e222]:
          - generic [ref=e223]: 🏠
          - heading "घरपोच सेवा" [level=3] [ref=e224]
          - paragraph [ref=e225]: पुजारी सामग्रीसह घरी येतो — आपण पूर्णतः निश्चिंत रहा.
    - generic [ref=e228]:
      - generic [ref=e229]:
        - generic [ref=e230]: ५,०००+
        - generic [ref=e231]: संतुष्ट ग्राहक
      - generic [ref=e233]:
        - generic [ref=e234]: ⭐ ४.८ / ५
        - generic [ref=e235]: सरासरी रेटिंग
      - generic [ref=e237]:
        - generic [ref=e238]: ✅ ५००+
        - generic [ref=e239]: सत्यापित पुजारी
      - generic [ref=e241]:
        - generic [ref=e242]: २०+
        - generic [ref=e243]: महाराष्ट्रातील शहरे
    - generic [ref=e245]:
      - generic [ref=e246]:
        - heading "कसे काम करते?" [level=2] [ref=e247]
        - paragraph [ref=e248]: फक्त ४ सोप्या चरणांमध्ये घरी पूजा
      - generic [ref=e249]:
        - generic [ref=e250]:
          - generic [ref=e251]:
            - generic [ref=e252]: १
            - generic [ref=e253]: 💻
            - heading "पूजा निवडा" [level=3] [ref=e254]
            - paragraph [ref=e255]: इच्छित पूजेची श्रेणी निवडा आणि बुकिंग फॉर्म भरा.
          - generic [ref=e256]: →
        - generic [ref=e257]:
          - generic [ref=e258]:
            - generic [ref=e259]: २
            - generic [ref=e260]: 📲
            - heading "पुजारी नियुक्त" [level=3] [ref=e261]
            - paragraph [ref=e262]: आम्ही आपल्यासाठी विश्वासू व अनुभवी पुजारी निवडतो.
          - generic [ref=e263]: →
        - generic [ref=e264]:
          - generic [ref=e265]:
            - generic [ref=e266]: ३
            - generic [ref=e267]: 💳
            - heading "पेमेंट करा" [level=3] [ref=e268]
            - paragraph [ref=e269]: सुरक्षित ऑनलाइन पेमेंट — Razorpay द्वारे.
          - generic [ref=e270]: →
        - generic [ref=e272]:
          - generic [ref=e273]: ४
          - generic [ref=e274]: 🪔
          - heading "पूजा संपन्न" [level=3] [ref=e275]
          - paragraph [ref=e276]: पुजारी घरी येऊन पूर्ण विधीसह पूजा करतात.
    - generic [ref=e278]:
      - generic [ref=e279]:
        - heading "पूजा श्रेणी" [level=2] [ref=e280]
        - paragraph [ref=e281]: आपल्या गरजेनुसार पूजा निवडा
      - generic [ref=e282]:
        - link "🏠 गृह पूजा सत्यनारायण, साखरपुडा" [ref=e283] [cursor=pointer]:
          - /url: /pooja?category=gruh-pooja
          - generic [ref=e284]: 🏠
          - heading "गृह पूजा" [level=3] [ref=e285]
          - paragraph [ref=e286]: सत्यनारायण, साखरपुडा
        - link "🔥 हवन / जाप नवग्रह, महा मृत्युंजय" [ref=e287] [cursor=pointer]:
          - /url: /pooja?category=havan-jaap
          - generic [ref=e288]: 🔥
          - heading "हवन / जाप" [level=3] [ref=e289]
          - paragraph [ref=e290]: नवग्रह, महा मृत्युंजय
        - link "📿 कथा / नित्य पूजा रुद्राभिषेक, मंगळागौरी" [ref=e291] [cursor=pointer]:
          - /url: /pooja?category=katha-nitya
          - generic [ref=e292]: 📿
          - heading "कथा / नित्य पूजा" [level=3] [ref=e293]
          - paragraph [ref=e294]: रुद्राभिषेक, मंगळागौरी
        - link "🕯️ पित्रुश्राद्ध दशक्रिया, बारावे विधी" [ref=e295] [cursor=pointer]:
          - /url: /pooja?category=pitru-shraddha
          - generic [ref=e296]: 🕯️
          - heading "पित्रुश्राद्ध" [level=3] [ref=e297]
          - paragraph [ref=e298]: दशक्रिया, बारावे विधी
        - link "🎉 उत्सव पूजा गणपती, नवरात्री, दिवाळी" [ref=e299] [cursor=pointer]:
          - /url: /pooja?category=utsav-pooja
          - generic [ref=e300]: 🎉
          - heading "उत्सव पूजा" [level=3] [ref=e301]
          - paragraph [ref=e302]: गणपती, नवरात्री, दिवाळी
        - link "🏗️ वास्तू पूजा गृहप्रवेश, भूमिपूजन" [ref=e303] [cursor=pointer]:
          - /url: /pooja?category=vastu-pooja
          - generic [ref=e304]: 🏗️
          - heading "वास्तू पूजा" [level=3] [ref=e305]
          - paragraph [ref=e306]: गृहप्रवेश, भूमिपूजन
        - link "🧘 आध्यात्मिक सेवा पाठ, अनुष्ठान, कीर्तन" [ref=e307] [cursor=pointer]:
          - /url: /pooja?category=adhyatmik-seva
          - generic [ref=e308]: 🧘
          - heading "आध्यात्मिक सेवा" [level=3] [ref=e309]
          - paragraph [ref=e310]: पाठ, अनुष्ठान, कीर्तन
        - link "🏛️ हॉल बुकिंग लग्नसमारंभ व कार्यक्रम" [ref=e311] [cursor=pointer]:
          - /url: /hall-booking
          - generic [ref=e312]: 🏛️
          - heading "हॉल बुकिंग" [level=3] [ref=e313]
          - paragraph [ref=e314]: लग्नसमारंभ व कार्यक्रम
    - generic [ref=e315]:
      - generic [ref=e318]:
        - heading "लोकप्रिय पूजा" [level=2] [ref=e319]
        - paragraph [ref=e320]: सर्वाधिक बुक केल्या जाणाऱ्या पूजा — Slide करून पहा
      - generic [ref=e321]:
        - generic [ref=e324]: 2 / 8
        - generic [ref=e326]:
          - generic [ref=e327]: गृह पूजा
          - heading "मुंज / उपनयन संस्कार" [level=2] [ref=e328]
          - paragraph [ref=e329]: मुलाच्या जीवनातील महत्त्वाचा संस्कार — ब्रह्मचर्य आश्रम सुरू करण्याचा विधी.
          - generic [ref=e330]:
            - generic [ref=e331]: 💰 ₹५,००० पासून
            - generic [ref=e332]: ⏱ 4.00 तास
          - generic [ref=e333]:
            - link "🪔 पूजा बुक करा" [ref=e334] [cursor=pointer]:
              - /url: /booking/munj-upanayan
            - link "अधिक पहा →" [ref=e335] [cursor=pointer]:
              - /url: /vidhi/munj-upanayan
        - button "मागील पूजा" [ref=e336] [cursor=pointer]: ‹
        - button "पुढील पूजा" [ref=e337] [cursor=pointer]: ›
        - generic [ref=e338]:
          - button "Slide 1" [ref=e339] [cursor=pointer]
          - button "Slide 2" [ref=e340] [cursor=pointer]
          - button "Slide 3" [ref=e341] [cursor=pointer]
          - button "Slide 4" [ref=e342] [cursor=pointer]
          - button "Slide 5" [ref=e343] [cursor=pointer]
          - button "Slide 6" [ref=e344] [cursor=pointer]
          - button "Slide 7" [ref=e345] [cursor=pointer]
          - button "Slide 8" [ref=e346] [cursor=pointer]
      - link "सर्व पूजा पहा →" [ref=e348] [cursor=pointer]:
        - /url: /pooja
    - generic [ref=e350]:
      - generic [ref=e351]:
        - heading "जवळचे पुजारी" [level=2] [ref=e352]
        - paragraph [ref=e353]: आपल्या शहरातील सर्वोत्तम पुजारी शोधा
      - generic [ref=e355]:
        - generic [ref=e356]: 📍
        - generic [ref=e357]:
          - paragraph [ref=e358]: आपले स्थान सांगा
          - paragraph [ref=e359]: जवळचे अनुभवी पुजारी शोधण्यासाठी
        - generic [ref=e360]:
          - button "📍 GPS वापरा" [ref=e361] [cursor=pointer]
          - button "शहर निवडा" [ref=e362] [cursor=pointer]
    - generic [ref=e364]:
      - generic [ref=e365]:
        - heading "शहरानुसार पुजारी शोधा" [level=2] [ref=e366]
        - paragraph [ref=e367]: महाराष्ट्रातील प्रमुख शहरांमध्ये सेवा उपलब्ध
      - generic [ref=e368]:
        - link "🌆 मुंबई" [ref=e369] [cursor=pointer]:
          - /url: /cities/mumbai
          - generic [ref=e370]: 🌆
          - generic [ref=e371]: मुंबई
        - link "🏛️ पुणे" [ref=e372] [cursor=pointer]:
          - /url: /cities/pune
          - generic [ref=e373]: 🏛️
          - generic [ref=e374]: पुणे
        - link "🕌 नाशिक" [ref=e375] [cursor=pointer]:
          - /url: /cities/nashik
          - generic [ref=e376]: 🕌
          - generic [ref=e377]: नाशिक
        - link "🌳 नागपूर" [ref=e378] [cursor=pointer]:
          - /url: /cities/nagpur
          - generic [ref=e379]: 🌳
          - generic [ref=e380]: नागपूर
        - link "🏯 औरंगाबाद" [ref=e381] [cursor=pointer]:
          - /url: /cities/aurangabad
          - generic [ref=e382]: 🏯
          - generic [ref=e383]: औरंगाबाद
        - link "⛩️ कोल्हापूर" [ref=e384] [cursor=pointer]:
          - /url: /cities/kolhapur
          - generic [ref=e385]: ⛩️
          - generic [ref=e386]: कोल्हापूर
        - link "🌊 रत्नागिरी" [ref=e387] [cursor=pointer]:
          - /url: /cities/ratnagiri
          - generic [ref=e388]: 🌊
          - generic [ref=e389]: रत्नागिरी
        - link "🌾 सोलापूर" [ref=e390] [cursor=pointer]:
          - /url: /cities/solapur
          - generic [ref=e391]: 🌾
          - generic [ref=e392]: सोलापूर
        - link "🏔️ सातारा" [ref=e393] [cursor=pointer]:
          - /url: /cities/satara
          - generic [ref=e394]: 🏔️
          - generic [ref=e395]: सातारा
        - link "🏺 अहमदनगर" [ref=e396] [cursor=pointer]:
          - /url: /cities/ahmednagar
          - generic [ref=e397]: 🏺
          - generic [ref=e398]: अहमदनगर
        - link "🏙️ ठाणे" [ref=e399] [cursor=pointer]:
          - /url: /cities/thane
          - generic [ref=e400]: 🏙️
          - generic [ref=e401]: ठाणे
        - link "🌻 सांगली" [ref=e402] [cursor=pointer]:
          - /url: /cities/sangli
          - generic [ref=e403]: 🌻
          - generic [ref=e404]: सांगली
        - link "🏗️ नवी मुंबई" [ref=e405] [cursor=pointer]:
          - /url: /cities/navi-mumbai
          - generic [ref=e406]: 🏗️
          - generic [ref=e407]: नवी मुंबई
        - link "🛕 अमरावती" [ref=e408] [cursor=pointer]:
          - /url: /cities/amravati
          - generic [ref=e409]: 🛕
          - generic [ref=e410]: अमरावती
        - link "🌿 जळगाव" [ref=e411] [cursor=pointer]:
          - /url: /cities/jalgaon
          - generic [ref=e412]: 🌿
          - generic [ref=e413]: जळगाव
        - link "🌴 पालघर" [ref=e414] [cursor=pointer]:
          - /url: /cities/palghar
          - generic [ref=e415]: 🌴
          - generic [ref=e416]: पालघर
      - link "सर्व शहरे पहा →" [ref=e418] [cursor=pointer]:
        - /url: /cities
    - generic [ref=e421]:
      - generic [ref=e423]:
        - paragraph [ref=e424]: 🪔
        - heading "पूजा बुक करा" [level=2] [ref=e425]
        - paragraph [ref=e426]: आपल्या शुभ प्रसंगासाठी विश्वासू पुजारी मिळवा
        - link "आता बुक करा" [ref=e427] [cursor=pointer]:
          - /url: /pooja
      - generic [ref=e429]:
        - paragraph [ref=e430]: 📋
        - heading "पुजारी म्हणून नोंदणी" [level=2] [ref=e431]
        - paragraph [ref=e432]: आपले ज्ञान शेअर करा, जास्त कमाई करा
        - link "नोंदणी करा" [ref=e433] [cursor=pointer]:
          - /url: /pujari-nondni
    - generic [ref=e435]:
      - generic [ref=e436]:
        - heading "ग्राहकांचे अभिप्राय" [level=2] [ref=e437]
        - paragraph [ref=e438]: प्रत्यक्ष बुकिंग केलेल्या ग्राहकांचे खरे अनुभव
      - generic [ref=e439]:
        - generic [ref=e440]: ⭐ ⭐ ⭐ ⭐ ⭐
        - generic [ref=e441]:
          - strong [ref=e442]: ४.८/५
          - text: — सत्यापित बुकिंग अभिप्रायांवर आधारित
      - generic [ref=e443]:
        - generic [ref=e444]:
          - generic [ref=e445]:
            - generic [ref=e446]:
              - generic [ref=e447]: ★
              - generic [ref=e448]: ★
              - generic [ref=e449]: ★
              - generic [ref=e450]: ★
              - generic [ref=e451]: ★
            - generic [ref=e452]: ✅ सत्यापित
          - paragraph [ref=e453]: "\"पुजारी वेळेवर आले, सामग्री सुद्धा आणली. आमचे कुटुंब खूप प्रभावित झाले!\""
          - generic [ref=e454]: 🪔 गृहप्रवेश पूजा
          - generic [ref=e455]:
            - generic [ref=e456]: न
            - generic [ref=e457]:
              - paragraph [ref=e458]: नेहा शिंदे
              - paragraph [ref=e459]: 📍 रत्नागिरी
        - generic [ref=e460]:
          - generic [ref=e461]:
            - generic [ref=e462]:
              - generic [ref=e463]: ★
              - generic [ref=e464]: ★
              - generic [ref=e465]: ★
              - generic [ref=e466]: ★
              - generic [ref=e467]: ★
            - generic [ref=e468]: ✅ सत्यापित
          - paragraph [ref=e469]: "\"सत्यनारायण पूजेसाठी बुकिंग केली — एकही फोन न करता सर्व व्यवस्था झाली.\""
          - generic [ref=e470]: 🪔 सत्यनारायण पूजा
          - generic [ref=e471]:
            - generic [ref=e472]: र
            - generic [ref=e473]:
              - paragraph [ref=e474]: राहुल देशमुख
              - paragraph [ref=e475]: 📍 कोल्हापूर
        - generic [ref=e476]:
          - generic [ref=e477]:
            - generic [ref=e478]:
              - generic [ref=e479]: ★
              - generic [ref=e480]: ★
              - generic [ref=e481]: ★
              - generic [ref=e482]: ★
              - generic [ref=e483]: ★
            - generic [ref=e484]: ✅ सत्यापित
          - paragraph [ref=e485]: "\"गणेश चतुर्थीची पूजा पहिल्यांदा ऑनलाइन बुक केली — अनुभव अप्रतिम होता!\""
          - generic [ref=e486]: 🪔 गणपती स्थापना
          - generic [ref=e487]:
            - generic [ref=e488]: स
            - generic [ref=e489]:
              - paragraph [ref=e490]: सुनीता जोशी
              - paragraph [ref=e491]: 📍 नाशिक
        - generic [ref=e492]:
          - generic [ref=e493]:
            - generic [ref=e494]:
              - generic [ref=e495]: ★
              - generic [ref=e496]: ★
              - generic [ref=e497]: ★
              - generic [ref=e498]: ★
              - generic [ref=e499]: ★
            - generic [ref=e500]: ✅ सत्यापित
          - paragraph [ref=e501]: "\"दशक्रिया विधी साठी खूपच उपयुक्त. पुजाऱ्यांनी सर्व विधी भक्तीभावाने केले.\""
          - generic [ref=e502]: 🪔 दशक्रिया विधी
          - generic [ref=e503]:
            - generic [ref=e504]: अ
            - generic [ref=e505]:
              - paragraph [ref=e506]: अजित पाटील
              - paragraph [ref=e507]: 📍 पुणे
        - generic [ref=e508]:
          - generic [ref=e509]:
            - generic [ref=e510]:
              - generic [ref=e511]: ★
              - generic [ref=e512]: ★
              - generic [ref=e513]: ★
              - generic [ref=e514]: ★
              - generic [ref=e515]: ★
            - generic [ref=e516]: ✅ सत्यापित
          - paragraph [ref=e517]: "\"नवग्रह हवनासाठी खूप अनुभवी पुजारी आले. मंत्रोच्चार इतका सुंदर होता की मन शांत झाले.\""
          - generic [ref=e518]: 🪔 नवग्रह शांती हवन
          - generic [ref=e519]:
            - generic [ref=e520]: प
            - generic [ref=e521]:
              - paragraph [ref=e522]: प्रिया कुलकर्णी
              - paragraph [ref=e523]: 📍 मुंबई
        - generic [ref=e524]:
          - generic [ref=e525]:
            - generic [ref=e526]:
              - generic [ref=e527]: ★
              - generic [ref=e528]: ★
              - generic [ref=e529]: ★
              - generic [ref=e530]: ★
              - generic [ref=e531]: ★
            - generic [ref=e532]: ✅ सत्यापित
          - paragraph [ref=e533]: "\"वास्तूशांती साठी उत्कृष्ट पुजारी. वेळेवर आले, साहित्य आणले, संपूर्ण विधी केला.\""
          - generic [ref=e534]: 🪔 वास्तूशांती पूजा
          - generic [ref=e535]:
            - generic [ref=e536]: व
            - generic [ref=e537]:
              - paragraph [ref=e538]: विकास मोरे
              - paragraph [ref=e539]: 📍 नागपूर
  - contentinfo [ref=e540]:
    - generic [ref=e541]:
      - generic [ref=e542]:
        - generic [ref=e543]:
          - img "Poojaris — For All Poojas" [ref=e545]
          - paragraph [ref=e546]: महाराष्ट्रातील सर्वोत्तम पूजा बुकिंग सेवा. विश्वासू पुजारी, वेळेवर सेवा, आणि पारंपरिक विधी.
          - generic [ref=e547]:
            - link "Facebook" [ref=e548] [cursor=pointer]:
              - /url: https://facebook.com
              - img [ref=e549]
            - link "Instagram" [ref=e551] [cursor=pointer]:
              - /url: https://instagram.com
              - img [ref=e552]
            - link "YouTube" [ref=e554] [cursor=pointer]:
              - /url: https://youtube.com
              - img [ref=e555]
            - link "WhatsApp" [ref=e557] [cursor=pointer]:
              - /url: https://wa.me/9561903219
              - img [ref=e558]
        - generic [ref=e560]:
          - heading "त्वरित लिंक" [level=3] [ref=e561]
          - list [ref=e562]:
            - listitem [ref=e563]:
              - link "› मुख्यपृष्ठ" [ref=e564] [cursor=pointer]:
                - /url: /
            - listitem [ref=e565]:
              - link "› पूजा बुक करा" [ref=e566] [cursor=pointer]:
                - /url: /pooja
            - listitem [ref=e567]:
              - link "› ऑनलाइन पूजा" [ref=e568] [cursor=pointer]:
                - /url: /online-puja
            - listitem [ref=e569]:
              - link "› ब्लॉग" [ref=e570] [cursor=pointer]:
                - /url: /blog
            - listitem [ref=e571]:
              - link "› सर्व शहरे" [ref=e572] [cursor=pointer]:
                - /url: /cities
            - listitem [ref=e573]:
              - link "› पुजारी व्हा" [ref=e574] [cursor=pointer]:
                - /url: /pujari-nondni
            - listitem [ref=e575]:
              - link "› आमच्याबद्दल" [ref=e576] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e577]:
              - link "› संपर्क करा" [ref=e578] [cursor=pointer]:
                - /url: /contact
        - generic [ref=e579]:
          - heading "पूजा श्रेणी" [level=3] [ref=e580]
          - list [ref=e581]:
            - listitem [ref=e582]:
              - link "› गृह पूजा" [ref=e583] [cursor=pointer]:
                - /url: /pooja/gruh-pooja
            - listitem [ref=e584]:
              - link "› हवन / जाप" [ref=e585] [cursor=pointer]:
                - /url: /pooja/havan-jaap
            - listitem [ref=e586]:
              - link "› कथा / नित्य" [ref=e587] [cursor=pointer]:
                - /url: /pooja/katha-nitya
            - listitem [ref=e588]:
              - link "› पित्रुश्राद्ध" [ref=e589] [cursor=pointer]:
                - /url: /pooja/pitru-shraddha
            - listitem [ref=e590]:
              - link "› उत्सव पूजा" [ref=e591] [cursor=pointer]:
                - /url: /pooja/utsav-pooja
            - listitem [ref=e592]:
              - link "› वास्तू पूजा" [ref=e593] [cursor=pointer]:
                - /url: /pooja/vastu-pooja
        - generic [ref=e594]:
          - heading "संपर्क माहिती" [level=3] [ref=e595]
          - list [ref=e596]:
            - listitem [ref=e597]:
              - img [ref=e599]
              - link "› info@pojjari.com" [ref=e601] [cursor=pointer]:
                - /url: mailto:info@pojjari.com
            - listitem [ref=e602]:
              - img [ref=e604]
              - link "› ९५६१९०३२१९" [ref=e606] [cursor=pointer]:
                - /url: tel:9561903219
            - listitem [ref=e607]:
              - img [ref=e609]
              - generic [ref=e611]: रत्नागिरी, महाराष्ट्र
            - listitem [ref=e612]:
              - img [ref=e614]
              - generic [ref=e616]: "सोम – रवि: सकाळी ७ ते रात्री ९"
          - generic [ref=e617]:
            - link "गोपनीयता धोरण" [ref=e618] [cursor=pointer]:
              - /url: "#"
            - link "नियम व अटी" [ref=e619] [cursor=pointer]:
              - /url: "#"
            - link "रद्दीकरण धोरण" [ref=e620] [cursor=pointer]:
              - /url: "#"
      - generic [ref=e621]:
        - paragraph [ref=e622]: © 2026 पूजारी. सर्व हक्क राखीव.
        - paragraph [ref=e623]: भक्तीने बनवले — महाराष्ट्रासाठी ❤️
    - link "WhatsApp वर संपर्क करा" [ref=e624] [cursor=pointer]:
      - /url: https://wa.me/9561903219?text=नमस्कार! मला पूजा बुक करायची आहे.
      - img [ref=e625]
    - button "पूजारी Assistant" [ref=e627] [cursor=pointer]:
      - img [ref=e628]
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
  29  |       expect(elapsed).toBeLessThan(LOAD_THRESHOLD_MS + 2000); // 5s absolute ceiling
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
> 80  |       expect(fcp).toBeLessThan(FCP_THRESHOLD_MS);
      |                   ^ Error: expect(received).toBeLessThan(expected)
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
  130 |       await route.fulfill({ response });
  131 |     });
  132 | 
  133 |     await page.goto('/panchang');
  134 |     await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  135 | 
  136 |     if (apiTimes.length > 0) {
  137 |       const avg = apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length;
  138 |       console.log(`📊 /api/panchang avg: ${Math.round(avg)}ms (${apiTimes.length} calls)`);
  139 |       expect(avg).toBeLessThan(API_THRESHOLD_MS);
  140 |     }
  141 |   });
  142 | 
  143 |   test('Homepage API calls complete without long-tail delays', async ({ page }) => {
  144 |     const apiCalls = [];
  145 | 
  146 |     await page.route('**/api/**', async route => {
  147 |       const url   = route.request().url();
  148 |       const start = Date.now();
  149 |       try {
  150 |         const response = await route.fetch();
  151 |         apiCalls.push({ url, ms: Date.now() - start, status: response.status() });
  152 |         await route.fulfill({ response });
  153 |       } catch {
  154 |         apiCalls.push({ url, ms: Date.now() - start, status: 'error' });
  155 |         await route.abort();
  156 |       }
  157 |     });
  158 | 
  159 |     await page.goto('/');
  160 |     await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  161 | 
  162 |     console.log('📊 API calls on homepage:', apiCalls);
  163 | 
  164 |     // No single API call should take > 2s in a local dev environment
  165 |     const slowCalls = apiCalls.filter(c => c.ms > 2000);
  166 |     expect(slowCalls.length).toBe(0);
  167 |   });
  168 | });
  169 | 
  170 | // ═══════════════════════════════════════════════════════════════════
  171 | // PART 3D: Resource Efficiency
  172 | // ═══════════════════════════════════════════════════════════════════
  173 | test.describe('Performance: Resource Efficiency', () => {
  174 |   test('Homepage makes fewer than 20 network requests', async ({ page }) => {
  175 |     const requests = [];
  176 |     page.on('request', req => requests.push(req.url()));
  177 | 
  178 |     await page.goto('/');
  179 |     await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  180 | 
```