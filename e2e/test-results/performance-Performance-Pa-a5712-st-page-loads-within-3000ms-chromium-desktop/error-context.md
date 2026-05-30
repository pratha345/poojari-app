# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance.spec.js >> Performance: Page Load Time >> PoojaList page loads within 3000ms
- Location: tests\performance.spec.js:23:5

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 5000
Received:   7127
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
      - link "पूजा" [ref=e46] [cursor=pointer]:
        - /url: /pooja
    - generic [ref=e48]:
      - complementary [ref=e49]:
        - heading "पूजा श्रेणी" [level=3] [ref=e50]
        - list [ref=e51]:
          - listitem [ref=e52]:
            - link "› 🙏 सर्व पूजा" [ref=e53] [cursor=pointer]:
              - /url: /pooja
          - listitem [ref=e54]:
            - link "› गृह पूजा" [ref=e55] [cursor=pointer]:
              - /url: /pooja/gruh-pooja
          - listitem [ref=e56]:
            - link "› हवन / जाप" [ref=e57] [cursor=pointer]:
              - /url: /pooja/havan-jaap
          - listitem [ref=e58]:
            - link "› कथा / नित्य पूजा" [ref=e59] [cursor=pointer]:
              - /url: /pooja/katha-nitya
          - listitem [ref=e60]:
            - link "› पित्रुश्राद्ध" [ref=e61] [cursor=pointer]:
              - /url: /pooja/pitru-shraddha
          - listitem [ref=e62]:
            - link "› उत्सव पूजा" [ref=e63] [cursor=pointer]:
              - /url: /pooja/utsav-pooja
          - listitem [ref=e64]:
            - link "› वास्तू पूजा" [ref=e65] [cursor=pointer]:
              - /url: /pooja/vastu-pooja
          - listitem [ref=e66]:
            - link "› आध्यात्मिक सेवा" [ref=e67] [cursor=pointer]:
              - /url: /pooja/adhyatmik-seva
          - listitem [ref=e68]:
            - link "› लग्न हॉल बुकिंग" [ref=e69] [cursor=pointer]:
              - /url: /pooja/lagn-hall
      - generic [ref=e70]:
        - generic [ref=e71]:
          - heading "सर्व पूजा" [level=1] [ref=e72]
          - generic [ref=e73]: 67 पूजा उपलब्ध
        - generic [ref=e74]:
          - generic [ref=e75]: "प्रसंग:"
          - generic [ref=e76]:
            - button "🏠 गृहप्रवेश" [ref=e77] [cursor=pointer]:
              - generic [ref=e78]: 🏠
              - text: गृहप्रवेश
            - button "🪔 सत्यनारायण" [ref=e79] [cursor=pointer]:
              - generic [ref=e80]: 🪔
              - text: सत्यनारायण
            - button "💍 लग्न" [ref=e81] [cursor=pointer]:
              - generic [ref=e82]: 💍
              - text: लग्न
            - button "👶 नामकरण" [ref=e83] [cursor=pointer]:
              - generic [ref=e84]: 👶
              - text: नामकरण
            - button "🔥 हवन" [ref=e85] [cursor=pointer]:
              - generic [ref=e86]: 🔥
              - text: हवन
            - button "🕯️ दशक्रिया" [ref=e87] [cursor=pointer]:
              - generic [ref=e88]: 🕯️
              - text: दशक्रिया
            - button "🐘 गणपती" [ref=e89] [cursor=pointer]:
              - generic [ref=e90]: 🐘
              - text: गणपती
            - button "🌟 नवग्रह" [ref=e91] [cursor=pointer]:
              - generic [ref=e92]: 🌟
              - text: नवग्रह
            - button "🎓 मुंज" [ref=e93] [cursor=pointer]:
              - generic [ref=e94]: 🎓
              - text: मुंज
            - button "💡 दिवाळी पूजा" [ref=e95] [cursor=pointer]:
              - generic [ref=e96]: 💡
              - text: दिवाळी पूजा
        - generic [ref=e97]:
          - generic [ref=e98]: ⭐
          - text: लोकप्रिय पूजा
        - generic [ref=e99]:
          - generic [ref=e100]:
            - generic [ref=e101]:
              - img [ref=e102]
              - text: लोकप्रिय
            - generic [ref=e104]:
              - img [ref=e105]
              - text: सत्यापित
            - link "सत्यनारायण पूजा तपशील पहा →" [ref=e107] [cursor=pointer]:
              - /url: /vidhi/satyanarayan-pooja
              - img "सत्यनारायण पूजा" [ref=e108]
              - generic [ref=e110]: तपशील पहा →
            - generic [ref=e111]:
              - generic [ref=e112]: गृह पूजा
              - heading "सत्यनारायण पूजा" [level=3] [ref=e114]:
                - link "सत्यनारायण पूजा" [ref=e115] [cursor=pointer]:
                  - /url: /vidhi/satyanarayan-pooja
              - paragraph [ref=e116]: घरामध्ये सुख-समृद्धी आणि ईश्वरी आशीर्वादासाठी केली जाणारी पूजा....
              - generic [ref=e117]:
                - generic [ref=e118]:
                  - img [ref=e119]
                  - text: 2.5 तास
                - generic [ref=e121]:
                  - img [ref=e122]
                  - text: ४.८
              - generic [ref=e124]:
                - generic [ref=e125]: ₹४,५००
                - link "बुक करा" [ref=e126] [cursor=pointer]:
                  - /url: /booking/satyanarayan-pooja
          - generic [ref=e127]:
            - generic [ref=e128]:
              - img [ref=e129]
              - text: लोकप्रिय
            - generic [ref=e131]:
              - img [ref=e132]
              - text: सत्यापित
            - link "मुंज / उपनयन संस्कार तपशील पहा →" [ref=e134] [cursor=pointer]:
              - /url: /vidhi/munj-upanayan
              - img "मुंज / उपनयन संस्कार" [ref=e135]
              - generic [ref=e137]: तपशील पहा →
            - generic [ref=e138]:
              - generic [ref=e139]: गृह पूजा
              - heading "मुंज / उपनयन संस्कार" [level=3] [ref=e141]:
                - link "मुंज / उपनयन संस्कार" [ref=e142] [cursor=pointer]:
                  - /url: /vidhi/munj-upanayan
              - paragraph [ref=e143]: मुलाच्या जीवनातील महत्त्वाचा संस्कार — ब्रह्मचर्य आश्रम सुरू करण्याचा विधी....
              - generic [ref=e144]:
                - generic [ref=e145]:
                  - img [ref=e146]
                  - text: 4 तास
                - generic [ref=e148]:
                  - img [ref=e149]
                  - text: ४.८
              - generic [ref=e151]:
                - generic [ref=e152]: ₹५,०००
                - link "बुक करा" [ref=e153] [cursor=pointer]:
                  - /url: /booking/munj-upanayan
          - generic [ref=e154]:
            - generic [ref=e155]:
              - img [ref=e156]
              - text: लोकप्रिय
            - generic [ref=e158]:
              - img [ref=e159]
              - text: सत्यापित
            - link "महा मृत्युंजय जाप तपशील पहा →" [ref=e161] [cursor=pointer]:
              - /url: /vidhi/maha-mrityunjay-jap
              - img "महा मृत्युंजय जाप" [ref=e162]
              - generic [ref=e164]: तपशील पहा →
            - generic [ref=e165]:
              - generic [ref=e166]: हवन / जाप
              - heading "महा मृत्युंजय जाप" [level=3] [ref=e168]:
                - link "महा मृत्युंजय जाप" [ref=e169] [cursor=pointer]:
                  - /url: /vidhi/maha-mrityunjay-jap
              - paragraph [ref=e170]: मृत्युंजय देवाला प्रसन्न करण्यासाठी व दीर्घायुष्यासाठी केला जाणारा जाप....
              - generic [ref=e171]:
                - generic [ref=e172]:
                  - img [ref=e173]
                  - text: 3 तास
                - generic [ref=e175]:
                  - img [ref=e176]
                  - text: ४.८
              - generic [ref=e178]:
                - generic [ref=e179]: ₹५,००१
                - link "बुक करा" [ref=e180] [cursor=pointer]:
                  - /url: /booking/maha-mrityunjay-jap
          - generic [ref=e181]:
            - generic [ref=e182]:
              - img [ref=e183]
              - text: लोकप्रिय
            - generic [ref=e185]:
              - img [ref=e186]
              - text: सत्यापित
            - link "दशक्रिया विधी तपशील पहा →" [ref=e188] [cursor=pointer]:
              - /url: /vidhi/dashkriya-vidhi
              - img "दशक्रिया विधी" [ref=e189]
              - generic [ref=e191]: तपशील पहा →
            - generic [ref=e192]:
              - generic [ref=e193]: पित्रुश्राद्ध
              - heading "दशक्रिया विधी" [level=3] [ref=e195]:
                - link "दशक्रिया विधी" [ref=e196] [cursor=pointer]:
                  - /url: /vidhi/dashkriya-vidhi
              - paragraph [ref=e197]: मृत्यूनंतर दहाव्या दिवशी पिंडदान, तर्पण आणि दशगात्र विधान....
              - generic [ref=e198]:
                - generic [ref=e199]:
                  - img [ref=e200]
                  - text: 3 तास
                - generic [ref=e202]:
                  - img [ref=e203]
                  - text: ४.८
              - generic [ref=e205]:
                - generic [ref=e206]: ₹१,५००
                - link "बुक करा" [ref=e207] [cursor=pointer]:
                  - /url: /booking/dashkriya-vidhi
          - generic [ref=e208]:
            - generic [ref=e209]:
              - img [ref=e210]
              - text: लोकप्रिय
            - generic [ref=e212]:
              - img [ref=e213]
              - text: सत्यापित
            - link "गणपती स्थापना तपशील पहा →" [ref=e215] [cursor=pointer]:
              - /url: /vidhi/ganpati-sthapna
              - img "गणपती स्थापना" [ref=e216]
              - generic [ref=e218]: तपशील पहा →
            - generic [ref=e219]:
              - generic [ref=e220]: उत्सव पूजा
              - heading "गणपती स्थापना" [level=3] [ref=e222]:
                - link "गणपती स्थापना" [ref=e223] [cursor=pointer]:
                  - /url: /vidhi/ganpati-sthapna
              - paragraph [ref=e224]: गणेशोत्सवाच्या पहिल्या दिवशी गणपतीच्या मूर्तीची स्थापना....
              - generic [ref=e225]:
                - generic [ref=e226]:
                  - img [ref=e227]
                  - text: 2 तास
                - generic [ref=e229]:
                  - img [ref=e230]
                  - text: ४.८
              - generic [ref=e232]:
                - generic [ref=e233]: ₹५,०९८
                - link "बुक करा" [ref=e234] [cursor=pointer]:
                  - /url: /booking/ganpati-sthapna
          - generic [ref=e235]:
            - generic [ref=e236]:
              - img [ref=e237]
              - text: लोकप्रिय
            - generic [ref=e239]:
              - img [ref=e240]
              - text: सत्यापित
            - link "लक्ष्मी पूजन (दिवाळी) तपशील पहा →" [ref=e242] [cursor=pointer]:
              - /url: /vidhi/lakshmi-poojan-diwali
              - img "लक्ष्मी पूजन (दिवाळी)" [ref=e243]
              - generic [ref=e245]: तपशील पहा →
            - generic [ref=e246]:
              - generic [ref=e247]: उत्सव पूजा
              - heading "लक्ष्मी पूजन (दिवाळी)" [level=3] [ref=e249]:
                - link "लक्ष्मी पूजन (दिवाळी)" [ref=e250] [cursor=pointer]:
                  - /url: /vidhi/lakshmi-poojan-diwali
              - paragraph [ref=e251]: दिवाळीच्या लक्ष्मीपूजनाच्या रात्री धन-संपत्तीसाठी पूजा....
              - generic [ref=e252]:
                - generic [ref=e253]:
                  - img [ref=e254]
                  - text: 2 तास
                - generic [ref=e256]:
                  - img [ref=e257]
                  - text: ४.८
              - generic [ref=e259]:
                - generic [ref=e260]: ₹३,६८२
                - link "बुक करा" [ref=e261] [cursor=pointer]:
                  - /url: /booking/lakshmi-poojan-diwali
          - generic [ref=e262]:
            - generic [ref=e263]:
              - img [ref=e264]
              - text: लोकप्रिय
            - generic [ref=e266]:
              - img [ref=e267]
              - text: सत्यापित
            - link "गृहप्रवेश व गृहशांती तपशील पहा →" [ref=e269] [cursor=pointer]:
              - /url: /vidhi/gruhpravesh-gruhshanti
              - img "गृहप्रवेश व गृहशांती" [ref=e270]
              - generic [ref=e272]: तपशील पहा →
            - generic [ref=e273]:
              - generic [ref=e274]: वास्तू पूजा
              - heading "गृहप्रवेश व गृहशांती" [level=3] [ref=e276]:
                - link "गृहप्रवेश व गृहशांती" [ref=e277] [cursor=pointer]:
                  - /url: /vidhi/gruhpravesh-gruhshanti
              - paragraph [ref=e278]: नवीन घरात प्रवेश करताना केली जाणारी शुभ पूजा....
              - generic [ref=e279]:
                - generic [ref=e280]:
                  - img [ref=e281]
                  - text: 4 तास
                - generic [ref=e283]:
                  - img [ref=e284]
                  - text: ४.८
              - generic [ref=e286]:
                - generic [ref=e287]: ₹५,००१
                - link "बुक करा" [ref=e288] [cursor=pointer]:
                  - /url: /booking/gruhpravesh-gruhshanti
          - generic [ref=e289]:
            - generic [ref=e290]:
              - img [ref=e291]
              - text: लोकप्रिय
            - generic [ref=e293]:
              - img [ref=e294]
              - text: सत्यापित
            - link "लग्न विधी तपशील पहा →" [ref=e296] [cursor=pointer]:
              - /url: /vidhi/lagn-vidhi
              - img "लग्न विधी" [ref=e297]
              - generic [ref=e299]: तपशील पहा →
            - generic [ref=e300]:
              - generic [ref=e301]: गृह पूजा
              - heading "लग्न विधी" [level=3] [ref=e303]:
                - link "लग्न विधी" [ref=e304] [cursor=pointer]:
                  - /url: /vidhi/lagn-vidhi
              - paragraph [ref=e305]: पारंपरिक हिंदू पद्धतीने विवाह संस्कार संपन्न करण्याचा शुभ विधी....
              - generic [ref=e306]:
                - generic [ref=e307]:
                  - img [ref=e308]
                  - text: 5 तास
                - generic [ref=e310]:
                  - img [ref=e311]
                  - text: ४.८
              - generic [ref=e313]:
                - generic [ref=e314]: ₹५,०००
                - link "बुक करा" [ref=e315] [cursor=pointer]:
                  - /url: /booking/lagn-vidhi
          - generic [ref=e316]:
            - generic [ref=e317]:
              - img [ref=e318]
              - text: सत्यापित
            - link "बाळ शॉवर पूजा तपशील पहा →" [ref=e320] [cursor=pointer]:
              - /url: /vidhi/baby-shower-pooja
              - img "बाळ शॉवर पूजा" [ref=e321]
              - generic [ref=e323]: तपशील पहा →
            - generic [ref=e324]:
              - generic [ref=e325]: गृह पूजा
              - heading "बाळ शॉवर पूजा" [level=3] [ref=e327]:
                - link "बाळ शॉवर पूजा" [ref=e328] [cursor=pointer]:
                  - /url: /vidhi/baby-shower-pooja
              - paragraph [ref=e329]: नवजात बाळाच्या स्वागतासाठी आणि आईच्या सुरक्षिततेसाठी केली जाणारी पूजा....
              - generic [ref=e330]:
                - generic [ref=e331]:
                  - img [ref=e332]
                  - text: 2 तास
                - generic [ref=e334]:
                  - img [ref=e335]
                  - text: ४.८
              - generic [ref=e337]:
                - generic [ref=e338]: ₹३,८५८
                - link "बुक करा" [ref=e339] [cursor=pointer]:
                  - /url: /booking/baby-shower-pooja
          - generic [ref=e340]:
            - generic [ref=e341]:
              - img [ref=e342]
              - text: सत्यापित
            - link "वाढदिवस पूजा तपशील पहा →" [ref=e344] [cursor=pointer]:
              - /url: /vidhi/birthday-pooja
              - img "वाढदिवस पूजा" [ref=e345]
              - generic [ref=e347]: तपशील पहा →
            - generic [ref=e348]:
              - generic [ref=e349]: गृह पूजा
              - heading "वाढदिवस पूजा" [level=3] [ref=e351]:
                - link "वाढदिवस पूजा" [ref=e352] [cursor=pointer]:
                  - /url: /vidhi/birthday-pooja
              - paragraph [ref=e353]: वाढदिवसाच्या शुभ प्रसंगी ईश्वराचे आभार मानण्यासाठी केली जाणारी पूजा....
              - generic [ref=e354]:
                - generic [ref=e355]:
                  - img [ref=e356]
                  - text: 1.5 तास
                - generic [ref=e358]:
                  - img [ref=e359]
                  - text: ४.८
              - generic [ref=e361]:
                - generic [ref=e362]: ₹२,९७४
                - link "बुक करा" [ref=e363] [cursor=pointer]:
                  - /url: /booking/birthday-pooja
          - generic [ref=e364]:
            - generic [ref=e365]:
              - img [ref=e366]
              - text: सत्यापित
            - link "साखरपुडा पूजा तपशील पहा →" [ref=e368] [cursor=pointer]:
              - /url: /vidhi/engagement-pooja
              - img "साखरपुडा पूजा" [ref=e369]
              - generic [ref=e371]: तपशील पहा →
            - generic [ref=e372]:
              - generic [ref=e373]: गृह पूजा
              - heading "साखरपुडा पूजा" [level=3] [ref=e375]:
                - link "साखरपुडा पूजा" [ref=e376] [cursor=pointer]:
                  - /url: /vidhi/engagement-pooja
              - paragraph [ref=e377]: साखरपुड्याच्या शुभ मुहूर्तावर लग्नाच्या सुरुवातीसाठी केली जाणारी पूजा....
              - generic [ref=e378]:
                - generic [ref=e379]:
                  - img [ref=e380]
                  - text: 2 तास
                - generic [ref=e382]:
                  - img [ref=e383]
                  - text: ४.८
              - generic [ref=e385]:
                - generic [ref=e386]: ₹३,९६४
                - link "बुक करा" [ref=e387] [cursor=pointer]:
                  - /url: /booking/engagement-pooja
          - generic [ref=e388]:
            - generic [ref=e389]:
              - img [ref=e390]
              - text: सत्यापित
            - link "नवग्रह शांती हवन तपशील पहा →" [ref=e392] [cursor=pointer]:
              - /url: /vidhi/navgraha-shanti-havan
              - img "नवग्रह शांती हवन" [ref=e393]
              - generic [ref=e395]: तपशील पहा →
            - generic [ref=e396]:
              - generic [ref=e397]: हवन / जाप
              - heading "नवग्रह शांती हवन" [level=3] [ref=e399]:
                - link "नवग्रह शांती हवन" [ref=e400] [cursor=pointer]:
                  - /url: /vidhi/navgraha-shanti-havan
              - paragraph [ref=e401]: नऊ ग्रहांच्या दोषांपासून मुक्तीसाठी केला जाणारा हवन....
              - generic [ref=e402]:
                - generic [ref=e403]:
                  - img [ref=e404]
                  - text: 4 तास
                - generic [ref=e406]:
                  - img [ref=e407]
                  - text: ४.८
              - generic [ref=e409]:
                - generic [ref=e410]: ₹५,०९८
                - link "बुक करा" [ref=e411] [cursor=pointer]:
                  - /url: /booking/navgraha-shanti-havan
        - generic [ref=e412]:
          - button "1" [ref=e413] [cursor=pointer]
          - button "2" [ref=e414] [cursor=pointer]
          - button "3" [ref=e415] [cursor=pointer]
          - button "4" [ref=e416] [cursor=pointer]
          - button "5" [ref=e417] [cursor=pointer]
          - button "6" [ref=e418] [cursor=pointer]
          - button "पुढे →" [ref=e419] [cursor=pointer]
  - contentinfo [ref=e420]:
    - generic [ref=e421]:
      - generic [ref=e422]:
        - generic [ref=e423]:
          - img "Poojaris — For All Poojas" [ref=e425]
          - paragraph [ref=e426]: महाराष्ट्रातील सर्वोत्तम पूजा बुकिंग सेवा. विश्वासू पुजारी, वेळेवर सेवा, आणि पारंपरिक विधी.
          - generic [ref=e427]:
            - link "Facebook" [ref=e428] [cursor=pointer]:
              - /url: https://facebook.com
              - img [ref=e429]
            - link "Instagram" [ref=e431] [cursor=pointer]:
              - /url: https://instagram.com
              - img [ref=e432]
            - link "YouTube" [ref=e434] [cursor=pointer]:
              - /url: https://youtube.com
              - img [ref=e435]
            - link "WhatsApp" [ref=e437] [cursor=pointer]:
              - /url: https://wa.me/9561903219
              - img [ref=e438]
        - generic [ref=e440]:
          - heading "त्वरित लिंक" [level=3] [ref=e441]
          - list [ref=e442]:
            - listitem [ref=e443]:
              - link "› मुख्यपृष्ठ" [ref=e444] [cursor=pointer]:
                - /url: /
            - listitem [ref=e445]:
              - link "› पूजा बुक करा" [ref=e446] [cursor=pointer]:
                - /url: /pooja
            - listitem [ref=e447]:
              - link "› ऑनलाइन पूजा" [ref=e448] [cursor=pointer]:
                - /url: /online-puja
            - listitem [ref=e449]:
              - link "› ब्लॉग" [ref=e450] [cursor=pointer]:
                - /url: /blog
            - listitem [ref=e451]:
              - link "› सर्व शहरे" [ref=e452] [cursor=pointer]:
                - /url: /cities
            - listitem [ref=e453]:
              - link "› पुजारी व्हा" [ref=e454] [cursor=pointer]:
                - /url: /pujari-nondni
            - listitem [ref=e455]:
              - link "› आमच्याबद्दल" [ref=e456] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e457]:
              - link "› संपर्क करा" [ref=e458] [cursor=pointer]:
                - /url: /contact
        - generic [ref=e459]:
          - heading "पूजा श्रेणी" [level=3] [ref=e460]
          - list [ref=e461]:
            - listitem [ref=e462]:
              - link "› गृह पूजा" [ref=e463] [cursor=pointer]:
                - /url: /pooja/gruh-pooja
            - listitem [ref=e464]:
              - link "› हवन / जाप" [ref=e465] [cursor=pointer]:
                - /url: /pooja/havan-jaap
            - listitem [ref=e466]:
              - link "› कथा / नित्य" [ref=e467] [cursor=pointer]:
                - /url: /pooja/katha-nitya
            - listitem [ref=e468]:
              - link "› पित्रुश्राद्ध" [ref=e469] [cursor=pointer]:
                - /url: /pooja/pitru-shraddha
            - listitem [ref=e470]:
              - link "› उत्सव पूजा" [ref=e471] [cursor=pointer]:
                - /url: /pooja/utsav-pooja
            - listitem [ref=e472]:
              - link "› वास्तू पूजा" [ref=e473] [cursor=pointer]:
                - /url: /pooja/vastu-pooja
        - generic [ref=e474]:
          - heading "संपर्क माहिती" [level=3] [ref=e475]
          - list [ref=e476]:
            - listitem [ref=e477]:
              - img [ref=e479]
              - link "› info@pojjari.com" [ref=e481] [cursor=pointer]:
                - /url: mailto:info@pojjari.com
            - listitem [ref=e482]:
              - img [ref=e484]
              - link "› ९५६१९०३२१९" [ref=e486] [cursor=pointer]:
                - /url: tel:9561903219
            - listitem [ref=e487]:
              - img [ref=e489]
              - generic [ref=e491]: रत्नागिरी, महाराष्ट्र
            - listitem [ref=e492]:
              - img [ref=e494]
              - generic [ref=e496]: "सोम – रवि: सकाळी ७ ते रात्री ९"
          - generic [ref=e497]:
            - link "गोपनीयता धोरण" [ref=e498] [cursor=pointer]:
              - /url: "#"
            - link "नियम व अटी" [ref=e499] [cursor=pointer]:
              - /url: "#"
            - link "रद्दीकरण धोरण" [ref=e500] [cursor=pointer]:
              - /url: "#"
      - generic [ref=e501]:
        - paragraph [ref=e502]: © 2026 पूजारी. सर्व हक्क राखीव.
        - paragraph [ref=e503]: भक्तीने बनवले — महाराष्ट्रासाठी ❤️
    - link "WhatsApp वर संपर्क करा" [ref=e504] [cursor=pointer]:
      - /url: https://wa.me/9561903219?text=नमस्कार! मला पूजा बुक करायची आहे.
      - img [ref=e505]
    - button "पूजारी Assistant" [ref=e507] [cursor=pointer]:
      - img [ref=e508]
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