// src/data/citiesData.js — Pan-India city SEO data
'use strict';

const CITIES = [
  // ═══════════════════════════════════════
  //  MAHARASHTRA
  // ═══════════════════════════════════════
  {
    slug: 'pune', name_mr: 'पुणे', name_en: 'Pune',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'पुणे',
    tagline: 'पुण्यनगरीत पूजा — घरी बसून बुक करा',
    desc: 'पुणे शहरातील अनुभवी आणि सत्यापित पुजारी आपल्या घरी येऊन संपूर्ण विधीपूर्वक पूजा करतात. गृहप्रवेश, सत्यनारायण, हवन, वास्तूशांती आणि सर्व प्रकारच्या पूजांसाठी आत्ताच बुकिंग करा.',
    seo_desc: 'पुणे मध्ये पूजा बुक करा — अनुभवी सत्यापित पुजारी घरी येतात. Satyanarayan, Griha Pravesh, Havan, Vastu Shanti puja booking in Pune.',
    keywords: 'pujari in pune, puja booking pune, pandit pune, पुणे पुजारी, पुणे पूजा बुकिंग, satyanarayan puja pune',
    popular_pujas: ['सत्यनारायण पूजा', 'गृहप्रवेश', 'वास्तूशांती', 'हवन / जाप', 'सत्यनारायण पूजा'],
    areas: ['शिवाजीनगर', 'हडपसर', 'कोथरूड', 'विमाननगर', 'पिंपरी-चिंचवड', 'वारजे', 'कर्वेनगर', 'डेक्कन'],
    testimonials: [
      { name: 'श्रीमती मेघा जोशी',   area: 'कोथरूड, पुणे',      stars: 5, text: 'गृहप्रवेशाच्या दिवशी पुजारींनी अत्यंत शांतपणे आणि भक्तिभावाने पूजा केली. खूप समाधान मिळाले.' },
      { name: 'श्री. विकास देशपांडे', area: 'हडपसर, पुणे',      stars: 5, text: 'सत्यनारायण पूजेसाठी उत्तम सेवा मिळाली. वेळेवर आले, सर्व सामग्री आणली. नक्कीच परत बुक करेन.' },
      { name: 'श्रीमती सुनिता पाटील', area: 'विमाननगर, पुणे',   stars: 5, text: 'वास्तूशांती पूजेसाठी बुकिंग केले. पुजारी अनुभवी होते आणि सर्व विधी व्यवस्थित पूर्ण केले.' },
    ],
    pujari_count: 45, booking_count: '800+', lat: 18.5204, lon: 73.8567,
  },
  {
    slug: 'mumbai', name_mr: 'मुंबई', name_en: 'Mumbai',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'मुंबई',
    tagline: 'मुंबईत पूजा — घरी बसून तत्काळ बुकिंग',
    desc: 'मुंबईच्या व्यस्त जीवनात पूजेसाठी वेळ नाही? आमचे अनुभवी पुजारी तुमच्या घरी, ऑफिसमध्ये किंवा व्हिडिओ कॉलद्वारे पूजा करतात. मुंबई, ठाणे, नवी मुंबई सर्व भागांत सेवा उपलब्ध.',
    seo_desc: 'मुंबई मध्ये पूजा बुक करा — अनुभवी सत्यापित पुजारी घरी येतात. Puja booking in Mumbai, pandit in Mumbai.',
    keywords: 'pujari in mumbai, puja booking mumbai, pandit mumbai, मुंबई पुजारी, मुंबई पूजा बुकिंग',
    popular_pujas: ['सत्यनारायण पूजा', 'गणपती स्थापना', 'गृहप्रवेश', 'सत्यनारायण पूजा', 'लक्ष्मीपूजन'],
    areas: ['अंधेरी', 'दादर', 'बोरिवली', 'घाटकोपर', 'कुर्ला', 'माटुंगा', 'विलेपार्ले', 'मलाड'],
    testimonials: [
      { name: 'श्री. राजेश शर्मा',   area: 'अंधेरी, मुंबई',   stars: 5, text: 'मुंबईत चांगले पुजारी शोधणे कठीण होते. पूजारी सेवेमुळे घरपोच उत्तम पुजारी मिळाले. धन्यवाद!' },
      { name: 'श्रीमती प्रिया मेहता', area: 'बोरिवली, मुंबई',  stars: 5, text: 'गृहप्रवेशाच्या दिवशी सकाळी ७ वाजता पुजारी वेळेवर आले. खूप समाधानकारक सेवा.' },
      { name: 'श्री. अमित नायर',      area: 'दादर, मुंबई',     stars: 4, text: 'सत्यनारायण पूजेसाठी उत्तम सेवा. पुजारी अनुभवी आणि मंत्रोच्चारात निपुण होते.' },
    ],
    pujari_count: 68, booking_count: '1,200+', lat: 19.0760, lon: 72.8777,
  },
  {
    slug: 'nashik', name_mr: 'नाशिक', name_en: 'Nashik',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'नाशिक',
    tagline: 'द्राक्षांचे शहर नाशिकमध्ये पूजा बुकिंग',
    desc: 'नाशिक — त्र्यंबकेश्वर, रामकुंड अशा पवित्र स्थळांचे शहर. येथे पूजा, हवन आणि धार्मिक विधींसाठी अनुभवी पुजारी उपलब्ध.',
    seo_desc: 'नाशिक मध्ये पूजा बुक करा — त्र्यंबकेश्वर विधी, Puja booking in Nashik, pandit nashik.',
    keywords: 'pujari nashik, puja booking nashik, pandit nashik, नाशिक पुजारी, त्र्यंबकेश्वर विधी',
    popular_pujas: ['रुद्राभिषेक', 'सत्यनारायण पूजा', 'हवन / जाप', 'गृहप्रवेश', 'कालसर्प शांती'],
    areas: ['सिडको', 'पंचवटी', 'त्र्यंबकेश्वर', 'दिंडोरी', 'गंगापूर', 'देवळाली'],
    testimonials: [
      { name: 'श्री. संतोष कुलकर्णी',  area: 'पंचवटी, नाशिक',   stars: 5, text: 'रुद्राभिषेकासाठी अत्यंत अनुभवी पुजारी मिळाले. संपूर्ण विधी मंत्रोच्चारासह झाला.' },
      { name: 'श्रीमती सावित्री जोशी',  area: 'सिडको, नाशिक',    stars: 5, text: 'कालसर्प शांतीसाठी बुकिंग केले. पुजारींनी सर्व विधी व्यवस्थित केले.' },
      { name: 'श्री. दीपक गायकवाड',    area: 'त्र्यंबकेश्वर',    stars: 5, text: 'नारायण नागबळी विधीसाठी उत्तम मार्गदर्शन मिळाले. सेवा अतिशय चांगली आहे.' },
    ],
    pujari_count: 28, booking_count: '400+', lat: 19.9975, lon: 73.7898,
  },
  {
    slug: 'nagpur', name_mr: 'नागपूर', name_en: 'Nagpur',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'नागपूर',
    tagline: 'ऑरेंज सिटी नागपुरात पूजा बुकिंग',
    desc: 'नागपूर — महाराष्ट्राची उपराजधानी. येथे सर्व हिंदू विधी, पूजा आणि हवनासाठी अनुभवी पुजारी उपलब्ध आहेत. संपूर्ण विदर्भात सेवा.',
    seo_desc: 'नागपूर मध्ये पूजा बुक करा — अनुभवी पुजारी घरी येतात. Puja booking Nagpur, pandit Nagpur.',
    keywords: 'pujari nagpur, puja booking nagpur, pandit nagpur, नागपूर पुजारी, विदर्भ पूजा',
    popular_pujas: ['सत्यनारायण पूजा', 'गृहप्रवेश', 'वास्तूशांती', 'हवन / जाप', 'नामकरण'],
    areas: ['सदर', 'धंतोली', 'मानेवाडा', 'कामठी', 'हिंगणा', 'बुटीबोरी', 'नरखेड'],
    testimonials: [
      { name: 'श्री. प्रशांत गोंडाने', area: 'सदर, नागपूर',     stars: 5, text: 'गृहप्रवेशासाठी उत्तम पुजारी मिळाले. संपूर्ण विधी शास्त्रोक्त पद्धतीने झाला.' },
      { name: 'श्रीमती रेखा भेंडे',   area: 'धंतोली, नागपूर',   stars: 4, text: 'सत्यनारायण पूजेसाठी बुकिंग केले. पुजारी वेळेवर आले आणि सेवा उत्तम होती.' },
      { name: 'श्री. विजय इंगळे',     area: 'मानेवाडा, नागपूर', stars: 5, text: 'वास्तूशांती पूजेसाठी अत्यंत अनुभवी पुजारी मिळाले. खूप समाधानकारक.' },
    ],
    pujari_count: 32, booking_count: '500+', lat: 21.1458, lon: 79.0882,
  },
  {
    slug: 'aurangabad', name_mr: 'औरंगाबाद', name_en: 'Aurangabad',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'औरंगाबाद',
    tagline: 'ऐतिहासिक औरंगाबादमध्ये पूजा बुकिंग',
    desc: 'औरंगाबाद — अजिंठा-वेरूळ लेण्यांचे शहर. मराठवाड्यातील सर्व पूजा आणि धार्मिक विधींसाठी अनुभवी पुजारी उपलब्ध.',
    seo_desc: 'औरंगाबाद मध्ये पूजा बुक करा. Puja booking Aurangabad, pandit Aurangabad, Marathwada.',
    keywords: 'pujari aurangabad, puja booking aurangabad, औरंगाबाद पुजारी, मराठवाडा पूजा',
    popular_pujas: ['सत्यनारायण पूजा', 'गृहप्रवेश', 'हवन', 'नामकरण', 'सीमंत'],
    areas: ['सिडको', 'हर्सूल', 'वाळूज', 'मिटमिटा', 'गारखेडा', 'उस्मानपुरा'],
    testimonials: [
      { name: 'श्री. अशोक काळे',    area: 'सिडको, औरंगाबाद',  stars: 5, text: 'खूप चांगली सेवा. पुजारी वेळेवर आले आणि संपूर्ण विधी शास्त्रोक्त झाला.' },
      { name: 'श्रीमती ज्योती शेख', area: 'हर्सूल, औरंगाबाद', stars: 4, text: 'नामकरण विधीसाठी उत्तम पुजारी मिळाले. सर्व विधी अत्यंत सुंदर झाले.' },
      { name: 'श्री. रमेश मुंडे',   area: 'वाळूज, औरंगाबाद',  stars: 5, text: 'सत्यनारायण पूजेसाठी उत्तम अनुभव. पुजारी अनुभवी आणि भक्तिभावाने विधी केले.' },
    ],
    pujari_count: 20, booking_count: '300+', lat: 19.8762, lon: 75.3433,
  },
  {
    slug: 'kolhapur', name_mr: 'कोल्हापूर', name_en: 'Kolhapur',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'कोल्हापूर',
    tagline: 'महालक्ष्मीच्या नगरीत पूजा बुकिंग',
    desc: 'कोल्हापूर — श्री अंबाबाई महालक्ष्मी मंदिराचे शहर. येथे सर्व धार्मिक विधी, देवीपूजा आणि हवनासाठी अनुभवी पुजारी.',
    seo_desc: 'कोल्हापूर मध्ये पूजा बुक करा. Puja booking Kolhapur, pandit Kolhapur, Mahalaxmi puja.',
    keywords: 'pujari kolhapur, puja booking kolhapur, कोल्हापूर पुजारी, महालक्ष्मी पूजा',
    popular_pujas: ['महालक्ष्मी पूजा', 'सत्यनारायण पूजा', 'गृहप्रवेश', 'हवन', 'देवीपूजा'],
    areas: ['शाहूपुरी', 'राजारामपुरी', 'ताराबाई पार्क', 'पंचगंगा', 'कसबा', 'उचगाव'],
    testimonials: [
      { name: 'श्रीमती सुनंदा पाटील', area: 'राजारामपुरी, कोल्हापूर', stars: 5, text: 'देवीपूजेसाठी उत्तम पुजारी मिळाले. मंत्रोच्चार अतिशय सुंदर होते.' },
      { name: 'श्री. भगवान मोरे',     area: 'शाहूपुरी, कोल्हापूर',    stars: 5, text: 'गृहप्रवेशाचा दिवस यादगार झाला. पुजारींनी सर्व विधी अत्यंत भक्तिभावाने केले.' },
      { name: 'श्रीमती लता कदम',      area: 'ताराबाई पार्क',           stars: 4, text: 'सत्यनारायण पूजेसाठी उत्तम अनुभव. नक्कीच परत बुकिंग करेन.' },
    ],
    pujari_count: 18, booking_count: '250+', lat: 16.7050, lon: 74.2433,
  },
  {
    slug: 'solapur', name_mr: 'सोलापूर', name_en: 'Solapur',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'सोलापूर',
    tagline: 'सोलापुरात पूजा बुकिंग — अनुभवी पुजारी',
    desc: 'सोलापूर — सिद्धेश्वर मंदिराचे शहर. येथे सर्व धार्मिक विधी आणि पूजांसाठी अनुभवी पुजारी उपलब्ध.',
    seo_desc: 'सोलापूर मध्ये पूजा बुक करा. Puja booking Solapur, pandit Solapur.',
    keywords: 'pujari solapur, puja booking solapur, सोलापूर पुजारी',
    popular_pujas: ['सत्यनारायण पूजा', 'गृहप्रवेश', 'हवन', 'नामकरण', 'वास्तूशांती'],
    areas: ['हुतात्मा चौक', 'मंगळवार पेठ', 'रेल्वे लाईन्स', 'शेटफळ', 'बार्शी', 'पंढरपूर'],
    testimonials: [
      { name: 'श्री. दत्तात्रय शेंडे', area: 'मंगळवार पेठ, सोलापूर', stars: 5, text: 'खूप चांगली सेवा मिळाली. पुजारी अनुभवी आणि भक्तिभावाने विधी करतात.' },
      { name: 'श्रीमती उषा जाधव',      area: 'हुतात्मा चौक, सोलापूर', stars: 4, text: 'गृहप्रवेशासाठी उत्तम पुजारी मिळाले. सेवा वेळेवर आणि व्यवस्थित होती.' },
      { name: 'श्री. बाळासाहेब काळे',  area: 'बार्शी, सोलापूर',       stars: 5, text: 'सत्यनारायण पूजेसाठी अत्यंत समाधानकारक सेवा मिळाली.' },
    ],
    pujari_count: 15, booking_count: '200+', lat: 17.6599, lon: 75.9064,
  },
  {
    slug: 'thane', name_mr: 'ठाणे', name_en: 'Thane',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'ठाणे',
    tagline: 'लेकांचे शहर ठाण्यात पूजा बुकिंग',
    desc: 'ठाणे — मुंबई महानगराचा भाग. ठाणे, कल्याण, डोंबिवली, उल्हासनगर आणि संपूर्ण ठाणे जिल्ह्यात अनुभवी पुजारी उपलब्ध.',
    seo_desc: 'ठाणे मध्ये पूजा बुक करा. Puja booking Thane, pandit Thane, Kalyan Dombivali puja.',
    keywords: 'pujari thane, puja booking thane, pandit thane, ठाणे पुजारी, कल्याण पूजा',
    popular_pujas: ['सत्यनारायण पूजा', 'गृहप्रवेश', 'गणपती स्थापना', 'हवन', 'सत्यनारायण पूजा'],
    areas: ['वागळे इस्टेट', 'कोपरी', 'कल्याण', 'डोंबिवली', 'उल्हासनगर', 'भिवंडी', 'अंबरनाथ'],
    testimonials: [
      { name: 'श्री. नितीन सावंत',   area: 'कल्याण, ठाणे',       stars: 5, text: 'डोंबिवलीत गृहप्रवेशासाठी उत्तम पुजारी मिळाले. खूप समाधान मिळाले.' },
      { name: 'श्रीमती मधुरा साळवी', area: 'वागळे इस्टेट, ठाणे', stars: 5, text: 'सत्यनारायण पूजेसाठी वेळेवर पुजारी आले. उत्तम अनुभव.' },
      { name: 'श्री. संदीप ठाकूर',   area: 'भिवंडी, ठाणे',       stars: 4, text: 'हवन विधीसाठी अनुभवी पुजारी मिळाले. पूजा अत्यंत शांतपणे झाली.' },
    ],
    pujari_count: 38, booking_count: '600+', lat: 19.2183, lon: 72.9781,
  },
  {
    slug: 'satara', name_mr: 'सातारा', name_en: 'Satara',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'सातारा',
    tagline: 'शिवरायांच्या सातारामध्ये पूजा बुकिंग',
    desc: 'सातारा — छत्रपती शिवाजी महाराजांची ऐतिहासिक नगरी. सर्व धार्मिक विधी, पूजा आणि हवनांसाठी अनुभवी पुजारी उपलब्ध.',
    seo_desc: 'सातारा मध्ये पूजा बुक करा. Puja booking Satara, pandit Satara.',
    keywords: 'pujari satara, puja booking satara, सातारा पुजारी',
    popular_pujas: ['सत्यनारायण पूजा', 'गृहप्रवेश', 'हवन', 'नामकरण', 'वास्तूशांती'],
    areas: ['सातारा शहर', 'कराड', 'वाई', 'महाबळेश्वर', 'पाचगणी', 'कोरेगाव'],
    testimonials: [
      { name: 'श्री. राजेंद्र पाटील',   area: 'कराड, सातारा',   stars: 5, text: 'उत्तम सेवा. पुजारी वेळेवर आले आणि संपूर्ण विधी शास्त्रोक्त झाला.' },
      { name: 'श्रीमती छाया माने',       area: 'सातारा शहर',      stars: 4, text: 'गृहप्रवेशासाठी चांगले पुजारी मिळाले. खूप समाधान मिळाले.' },
      { name: 'श्री. अण्णासाहेब जाधव',  area: 'वाई, सातारा',     stars: 5, text: 'सत्यनारायण पूजेसाठी उत्तम अनुभव. नक्कीच परत बुकिंग करेन.' },
    ],
    pujari_count: 14, booking_count: '180+', lat: 17.6868, lon: 73.9847,
  },
  {
    slug: 'ratnagiri', name_mr: 'रत्नागिरी', name_en: 'Ratnagiri',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'रत्नागिरी',
    tagline: 'कोकणच्या रत्नागिरीत पूजा बुकिंग',
    desc: 'रत्नागिरी — कोकणचे निसर्गरम्य शहर. रत्नागिरी, राजापूर, संगमेश्वर भागात सर्व पूजांसाठी अनुभवी पुजारी उपलब्ध.',
    seo_desc: 'रत्नागिरी मध्ये पूजा बुक करा. Puja booking Ratnagiri, pandit Ratnagiri, Konkan.',
    keywords: 'pujari ratnagiri, puja booking ratnagiri, रत्नागिरी पुजारी, कोकण पूजा',
    popular_pujas: ['सत्यनारायण पूजा', 'गृहप्रवेश', 'हवन', 'पितृश्राद्ध'],
    areas: ['रत्नागिरी शहर', 'चिपळूण', 'राजापूर', 'संगमेश्वर', 'गुहागर', 'दापोली'],
    testimonials: [
      { name: 'श्री. सुभाष परब',       area: 'चिपळूण, रत्नागिरी', stars: 5, text: 'कोकणात चांगले पुजारी मिळणे कठीण होते. पूजारी सेवेमुळे उत्तम पुजारी मिळाले.' },
      { name: 'श्रीमती माधवी केळकर',  area: 'रत्नागिरी शहर',      stars: 5, text: 'गृहप्रवेशाचा दिवस यादगार झाला. पुजारींनी अत्यंत भक्तिभावाने विधी केले.' },
      { name: 'श्री. प्रभाकर साटम',    area: 'दापोली, रत्नागिरी', stars: 4, text: 'सत्यनारायण पूजेसाठी उत्तम सेवा मिळाली. नक्कीच परत बुकिंग करेन.' },
    ],
    pujari_count: 12, booking_count: '150+', lat: 17.0000, lon: 73.3000,
  },
  {
    slug: 'ahmednagar', name_mr: 'अहमदनगर', name_en: 'Ahmednagar',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'अहमदनगर',
    tagline: 'अहमदनगरमध्ये पूजा बुकिंग — अनुभवी पुजारी',
    desc: 'अहमदनगर जिल्ह्यात सर्व धार्मिक विधी, पूजा आणि हवनांसाठी अनुभवी पुजारी उपलब्ध. नगर शहर, शिर्डी, कोपरगाव, संगमनेर भागात सेवा.',
    seo_desc: 'अहमदनगर मध्ये पूजा बुक करा. Puja booking Ahmednagar, pandit Shirdi.',
    keywords: 'pujari ahmednagar, puja booking ahmednagar, नगर पुजारी, शिर्डी पूजा',
    popular_pujas: ['साई बाबा पूजा', 'सत्यनारायण पूजा', 'गृहप्रवेश', 'हवन', 'नवचंडी हवन'],
    areas: ['नगर शहर', 'शिर्डी', 'कोपरगाव', 'संगमनेर', 'राहुरी', 'श्रीगोंदा'],
    testimonials: [
      { name: 'श्री. दिलीप घोडे',     area: 'संगमनेर, नगर', stars: 5, text: 'उत्तम सेवा. पुजारींनी मनोभावे विधी केले. खूप समाधान मिळाले.' },
      { name: 'श्रीमती अनिता भोसले', area: 'नगर शहर',       stars: 4, text: 'गृहप्रवेशासाठी वेळेवर पुजारी आले. सेवा उत्तम होती.' },
      { name: 'श्री. किरण लोंढे',     area: 'कोपरगाव',       stars: 5, text: 'सत्यनारायण पूजेसाठी अनुभवी पुजारी मिळाले. नक्कीच परत करेन.' },
    ],
    pujari_count: 16, booking_count: '220+', lat: 19.0952, lon: 74.7498,
  },
  {
    slug: 'sangli', name_mr: 'सांगली', name_en: 'Sangli',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'सांगली',
    tagline: 'सांगलीत पूजा बुकिंग — हळदीच्या नगरीत',
    desc: 'सांगली — हळद व्यापाराचे केंद्र आणि गणेश उत्सवाचे शहर. सर्व पूजा, हवन आणि धार्मिक विधींसाठी अनुभवी पुजारी उपलब्ध.',
    seo_desc: 'सांगली मध्ये पूजा बुक करा. Puja booking Sangli, pandit Sangli.',
    keywords: 'pujari sangli, puja booking sangli, सांगली पुजारी',
    popular_pujas: ['सत्यनारायण पूजा', 'गणपती स्थापना', 'गृहप्रवेश', 'हवन', 'वास्तूशांती'],
    areas: ['सांगली शहर', 'मिरज', 'कुपवाड', 'वाळवा', 'कवठेमहांकाळ', 'तासगाव'],
    testimonials: [
      { name: 'श्री. संभाजी पाटील',  area: 'मिरज, सांगली',  stars: 5, text: 'गृहप्रवेशाचा दिवस खूप शुभ झाला. पुजारींची सेवा उत्तम होती.' },
      { name: 'श्रीमती वर्षा जाधव', area: 'सांगली शहर',     stars: 4, text: 'सत्यनारायण पूजेसाठी अनुभवी पुजारी मिळाले. धन्यवाद!' },
      { name: 'श्री. अनिल खांडेकर', area: 'कुपवाड, सांगली', stars: 5, text: 'वास्तूशांती पूजेसाठी उत्तम सेवा. पुजारी भक्तिभावाने विधी करतात.' },
    ],
    pujari_count: 13, booking_count: '170+', lat: 16.8524, lon: 74.5815,
  },

  {
    slug: 'navi-mumbai', name_mr: 'नवी मुंबई', name_en: 'Navi Mumbai',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'ठाणे',
    tagline: 'नवी मुंबईत पूजा बुकिंग — घरपोच सेवा',
    desc: 'नवी मुंबई — वाशी, खारघर, नेरूळ, पनवेल, बेलापूर आणि संपूर्ण नवी मुंबईत अनुभवी पुजारी उपलब्ध. गृहप्रवेश, सत्यनारायण, हवन सर्व विधींसाठी बुकिंग करा.',
    seo_desc: 'नवी मुंबई मध्ये पूजा बुक करा — अनुभवी पुजारी घरी येतात. Puja booking Navi Mumbai, pandit Navi Mumbai, Kharghar, Vashi.',
    keywords: 'pujari navi mumbai, puja booking navi mumbai, pandit navi mumbai, नवी मुंबई पुजारी, vashi puja, kharghar pandit',
    popular_pujas: ['सत्यनारायण पूजा', 'गृहप्रवेश', 'वास्तूशांती', 'हवन / जाप', 'गणपती स्थापना'],
    areas: ['वाशी', 'खारघर', 'नेरूळ', 'पनवेल', 'बेलापूर', 'ऐरोली', 'घणसोली', 'तळोजा'],
    testimonials: [
      { name: 'श्रीमती पूजा देशमुख', area: 'खारघर, नवी मुंबई',  stars: 5, text: 'गृहप्रवेशासाठी उत्तम पुजारी मिळाले. वेळेवर आले, सर्व सामग्री आणली.' },
      { name: 'श्री. अजय नाईक',      area: 'वाशी, नवी मुंबई',   stars: 5, text: 'सत्यनारायण पूजेसाठी खूप समाधानकारक सेवा. निश्चित परत बुक करेन.' },
      { name: 'श्रीमती स्वाती कदम', area: 'नेरूळ, नवी मुंबई',  stars: 4, text: 'वास्तूशांती विधी अत्यंत शांतपणे आणि भक्तिभावाने झाले.' },
    ],
    pujari_count: 35, booking_count: '550+', lat: 19.0330, lon: 73.0297,
  },
  {
    slug: 'jalgaon', name_mr: 'जळगाव', name_en: 'Jalgaon',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'जळगाव',
    tagline: 'केळीच्या जळगावात पूजा बुकिंग',
    desc: 'जळगाव — खानदेशाचे प्रमुख शहर. जळगाव, भुसावळ, अमळनेर, चाळीसगाव भागात सर्व धार्मिक विधी, पूजा आणि हवनांसाठी अनुभवी पुजारी उपलब्ध.',
    seo_desc: 'जळगाव मध्ये पूजा बुक करा — अनुभवी पुजारी घरी येतात. Puja booking Jalgaon, pandit Jalgaon, Khandesh.',
    keywords: 'pujari jalgaon, puja booking jalgaon, pandit jalgaon, जळगाव पुजारी, खानदेश पूजा, bhusawal puja',
    popular_pujas: ['सत्यनारायण पूजा', 'गृहप्रवेश', 'हवन / जाप', 'नामकरण', 'वास्तूशांती'],
    areas: ['जळगाव शहर', 'भुसावळ', 'अमळनेर', 'चाळीसगाव', 'पाचोरा', 'एरंडोल', 'धरणगाव'],
    testimonials: [
      { name: 'श्री. सुनील पाटील',  area: 'जळगाव शहर',    stars: 5, text: 'उत्तम सेवा. पुजारी वेळेवर आले आणि सर्व विधी शास्त्रोक्त झाले.' },
      { name: 'श्रीमती कल्पना बोरसे', area: 'भुसावळ, जळगाव', stars: 4, text: 'गृहप्रवेशासाठी चांगले पुजारी मिळाले. खूप समाधान मिळाले.' },
      { name: 'श्री. महेश सोनार',   area: 'अमळनेर, जळगाव', stars: 5, text: 'सत्यनारायण पूजेसाठी अनुभवी पुजारी मिळाले. नक्कीच परत करेन.' },
    ],
    pujari_count: 16, booking_count: '200+', lat: 21.0077, lon: 75.5626,
  },
  {
    slug: 'latur', name_mr: 'लातूर', name_en: 'Latur',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'लातूर',
    tagline: 'लातूरमध्ये पूजा बुकिंग — मराठवाडा',
    desc: 'लातूर — मराठवाड्याचे महत्त्वाचे शहर. लातूर, उदगीर, निलंगा भागात सर्व पूजा, हवन आणि संस्कारांसाठी अनुभवी पुजारी उपलब्ध.',
    seo_desc: 'लातूर मध्ये पूजा बुक करा — अनुभवी पुजारी घरी येतात. Puja booking Latur, pandit Latur, Marathwada.',
    keywords: 'pujari latur, puja booking latur, pandit latur, लातूर पुजारी, मराठवाडा पूजा',
    popular_pujas: ['सत्यनारायण पूजा', 'गृहप्रवेश', 'हवन', 'नामकरण', 'श्राद्ध विधी'],
    areas: ['लातूर शहर', 'उदगीर', 'निलंगा', 'अहमदपूर', 'चाकूर', 'शिरूर अनंतपाळ'],
    testimonials: [
      { name: 'श्री. विठ्ठल जाधव',    area: 'लातूर शहर',   stars: 5, text: 'पूजारी सेवा खूप उत्तम आहे. वेळेत पुजारी आले आणि भक्तिभावाने विधी केले.' },
      { name: 'श्रीमती सरस्वती कुलकर्णी', area: 'उदगीर, लातूर', stars: 4, text: 'नामकरण विधीसाठी अनुभवी पुजारी मिळाले. खूप समाधान मिळाले.' },
      { name: 'श्री. बसवराज पाटील', area: 'निलंगा, लातूर',  stars: 5, text: 'सत्यनारायण पूजेसाठी उत्तम सेवा. नक्कीच परत बुकिंग करेन.' },
    ],
    pujari_count: 14, booking_count: '180+', lat: 18.4088, lon: 76.5604,
  },
  {
    slug: 'nanded', name_mr: 'नांदेड', name_en: 'Nanded',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'नांदेड',
    tagline: 'नांदेडमध्ये पूजा बुकिंग — गुरुद्वाराच्या नगरीत',
    desc: 'नांदेड — श्री हजूर साहिब गुरुद्वाराचे पवित्र शहर. नांदेड, देगलूर, किनवट भागात हिंदू धार्मिक विधी, पूजा आणि हवनासाठी पुजारी उपलब्ध.',
    seo_desc: 'नांदेड मध्ये पूजा बुक करा — अनुभवी पुजारी घरी येतात. Puja booking Nanded, pandit Nanded.',
    keywords: 'pujari nanded, puja booking nanded, pandit nanded, नांदेड पुजारी, नांदेड पूजा',
    popular_pujas: ['सत्यनारायण पूजा', 'गृहप्रवेश', 'हवन', 'नामकरण', 'वास्तूशांती'],
    areas: ['नांदेड शहर', 'देगलूर', 'किनवट', 'मुखेड', 'भोकर', 'हदगाव', 'अर्धापूर'],
    testimonials: [
      { name: 'श्री. रमेश तेलकर',  area: 'नांदेड शहर',    stars: 5, text: 'गृहप्रवेशासाठी अत्यंत अनुभवी पुजारी मिळाले. सेवा खूप उत्तम होती.' },
      { name: 'श्रीमती मालती बिरादार', area: 'देगलूर, नांदेड', stars: 4, text: 'सत्यनारायण पूजेसाठी वेळेत पुजारी आले. खूप समाधान मिळाले.' },
      { name: 'श्री. संभाजी काळे',  area: 'नांदेड शहर',    stars: 5, text: 'हवन विधीसाठी उत्तम सेवा. निश्चित परत बुक करेन.' },
    ],
    pujari_count: 12, booking_count: '150+', lat: 19.1383, lon: 77.3210,
  },
  {
    slug: 'akola', name_mr: 'अकोला', name_en: 'Akola',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'अकोला',
    tagline: 'अकोल्यात पूजा बुकिंग — विदर्भाचे शहर',
    desc: 'अकोला — विदर्भातील प्रमुख कापूस उत्पादक जिल्हा. अकोला, बाळापूर, मूर्तिजापूर भागात सर्व धार्मिक विधी आणि पूजांसाठी पुजारी उपलब्ध.',
    seo_desc: 'अकोला मध्ये पूजा बुक करा — अनुभवी पुजारी घरी येतात. Puja booking Akola, pandit Akola, Vidarbha.',
    keywords: 'pujari akola, puja booking akola, pandit akola, अकोला पुजारी, विदर्भ पूजा',
    popular_pujas: ['सत्यनारायण पूजा', 'गृहप्रवेश', 'हवन / जाप', 'नामकरण', 'वास्तूशांती'],
    areas: ['अकोला शहर', 'बाळापूर', 'मूर्तिजापूर', 'अकोट', 'तेल्हारा', 'पातूर', 'बार्शीटाकळी'],
    testimonials: [
      { name: 'श्री. प्रकाश देशमुख', area: 'अकोला शहर',     stars: 5, text: 'खूप उत्तम सेवा. पुजारी अनुभवी आणि वेळेवर आले.' },
      { name: 'श्रीमती शांता वानखेडे', area: 'बाळापूर, अकोला', stars: 4, text: 'गृहप्रवेशाचा दिवस यादगार झाला. पुजारींनी सर्व विधी भक्तिभावाने केले.' },
      { name: 'श्री. दिनेश जोशी',     area: 'अकोट, अकोला',   stars: 5, text: 'सत्यनारायण पूजेसाठी उत्तम अनुभव. नक्कीच परत करेन.' },
    ],
    pujari_count: 14, booking_count: '170+', lat: 20.7002, lon: 77.0082,
  },
  {
    slug: 'amravati', name_mr: 'अमरावती', name_en: 'Amravati',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'अमरावती',
    tagline: 'अमरावतीत पूजा बुकिंग — अंबादेवीच्या नगरीत',
    desc: 'अमरावती — श्री अंबादेवी मंदिराचे शहर. विदर्भातील अमरावती, अचलपूर, दर्यापूर भागात अनुभवी पुजारी उपलब्ध. देवीपूजा, हवन, सर्व संस्कारांसाठी बुकिंग करा.',
    seo_desc: 'अमरावती मध्ये पूजा बुक करा — अनुभवी पुजारी घरी येतात. Puja booking Amravati, pandit Amravati, Ambadevi puja.',
    keywords: 'pujari amravati, puja booking amravati, pandit amravati, अमरावती पुजारी, अंबादेवी पूजा',
    popular_pujas: ['अंबादेवी पूजा', 'सत्यनारायण पूजा', 'गृहप्रवेश', 'हवन', 'नवरात्री पूजा'],
    areas: ['अमरावती शहर', 'अचलपूर', 'दर्यापूर', 'मोर्शी', 'वरुड', 'चांदूर बाजार', 'धामणगाव'],
    testimonials: [
      { name: 'श्री. सतीश कोल्हे',    area: 'अमरावती शहर',   stars: 5, text: 'अंबादेवी पूजेसाठी उत्तम पुजारी मिळाले. संपूर्ण विधी मनोभावाने झाले.' },
      { name: 'श्रीमती निर्मला खडसे', area: 'अचलपूर, अमरावती', stars: 5, text: 'गृहप्रवेशाचा दिवस खूप शुभ झाला. पुजारी अनुभवी होते.' },
      { name: 'श्री. अनिल चव्हाण',    area: 'वरुड, अमरावती',  stars: 4, text: 'सत्यनारायण पूजेसाठी खूप चांगली सेवा मिळाली.' },
    ],
    pujari_count: 17, booking_count: '220+', lat: 20.9320, lon: 77.7523,
  },
  {
    slug: 'dhule', name_mr: 'धुळे', name_en: 'Dhule',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'धुळे',
    tagline: 'धुळ्यात पूजा बुकिंग — खानदेशाचे प्रवेशद्वार',
    desc: 'धुळे — खानदेशाचे प्रवेशद्वार. धुळे, शिरपूर, शिंदखेडा भागात सर्व हिंदू विधी, पूजा आणि हवनांसाठी अनुभवी पुजारी उपलब्ध.',
    seo_desc: 'धुळे मध्ये पूजा बुक करा — अनुभवी पुजारी घरी येतात. Puja booking Dhule, pandit Dhule, Khandesh.',
    keywords: 'pujari dhule, puja booking dhule, pandit dhule, धुळे पुजारी, खानदेश पूजा',
    popular_pujas: ['सत्यनारायण पूजा', 'गृहप्रवेश', 'हवन', 'नामकरण', 'वास्तूशांती'],
    areas: ['धुळे शहर', 'शिरपूर', 'शिंदखेडा', 'साक्री', 'नवापूर', 'धरणगाव'],
    testimonials: [
      { name: 'श्री. रमेश अहिरे',    area: 'धुळे शहर',     stars: 5, text: 'खूप चांगली सेवा. पुजारी वेळेत आले आणि भक्तिभावाने विधी केले.' },
      { name: 'श्रीमती गीता बागुल',  area: 'शिरपूर, धुळे',  stars: 4, text: 'गृहप्रवेशाचा दिवस यादगार झाला. उत्तम पुजारी मिळाले.' },
      { name: 'श्री. नाना पवार',     area: 'साक्री, धुळे',  stars: 5, text: 'सत्यनारायण पूजेसाठी उत्तम अनुभव. नक्कीच परत करेन.' },
    ],
    pujari_count: 11, booking_count: '130+', lat: 20.9042, lon: 74.7749,
  },
  {
    slug: 'palghar', name_mr: 'पालघर', name_en: 'Palghar',
    state_mr: 'महाराष्ट्र', state_en: 'Maharashtra', country: 'india',
    district_mr: 'पालघर',
    tagline: 'पालघर जिल्ह्यात पूजा बुकिंग — वसई-विरार',
    desc: 'पालघर जिल्हा — वसई, विरार, नालासोपारा, मीरा-भाईंदर ते बोईसर पर्यंत सर्व भागात अनुभवी पुजारी उपलब्ध. गृहप्रवेश, सत्यनारायण, हवन सर्व विधींसाठी बुकिंग करा.',
    seo_desc: 'पालघर मध्ये पूजा बुक करा — Vasai Virar Mira Bhayandar. Puja booking Palghar, pandit Vasai Virar.',
    keywords: 'pujari palghar, puja booking vasai virar, pandit vasai, पालघर पुजारी, वसई पूजा, विरार पुजारी',
    popular_pujas: ['सत्यनारायण पूजा', 'गृहप्रवेश', 'वास्तूशांती', 'हवन / जाप', 'नामकरण'],
    areas: ['वसई', 'विरार', 'नालासोपारा', 'मीरा-भाईंदर', 'पालघर शहर', 'बोईसर', 'डहाणू', 'तलासरी'],
    testimonials: [
      { name: 'श्री. संदेश ठाकूर',   area: 'वसई, पालघर',     stars: 5, text: 'गृहप्रवेशासाठी उत्तम पुजारी मिळाले. वेळेवर आले आणि सर्व साहित्य आणले.' },
      { name: 'श्रीमती मनीषा पाटील', area: 'विरार, पालघर',    stars: 5, text: 'सत्यनारायण पूजेसाठी खूप समाधानकारक सेवा. निश्चित परत बुक करेन.' },
      { name: 'श्री. अशोक वारे',     area: 'नालासोपारा',      stars: 4, text: 'हवन विधीसाठी अनुभवी पुजारी मिळाले. खूप चांगली सेवा.' },
    ],
    pujari_count: 28, booking_count: '380+', lat: 19.6967, lon: 72.7697,
  },

  // ═══════════════════════════════════════
  //  DELHI NCR
  // ═══════════════════════════════════════
  {
    slug: 'delhi', name_mr: 'दिल्ली', name_en: 'Delhi',
    state_mr: 'दिल्ली', state_en: 'Delhi', country: 'india',
    district_mr: 'Delhi',
    tagline: 'Book Pandit in Delhi for Puja & Havan',
    desc: 'Delhi — the capital of India. Book experienced, verified pandits for Griha Pravesh, Satyanarayan Puja, Havan, Wedding rituals and all Hindu ceremonies. Available across all Delhi NCR areas.',
    seo_desc: 'Book pandit online in Delhi for puja, havan, griha pravesh. Verified pandits near me in Delhi NCR.',
    keywords: 'pandit delhi, puja booking delhi, pandit near me delhi, book pandit delhi NCR, satyanarayan puja delhi',
    popular_pujas: ['Satyanarayan Puja', 'Griha Pravesh', 'Navratri Puja', 'Havan', 'Mundan Ceremony'],
    areas: ['South Delhi', 'North Delhi', 'Dwarka', 'Rohini', 'Laxmi Nagar', 'Noida', 'Gurgaon', 'Faridabad'],
    testimonials: [
      { name: 'Rajesh Sharma',  area: 'Dwarka, Delhi',      stars: 5, text: 'Excellent pandit for our Griha Pravesh. All rituals performed with full Vedic procedure. Very satisfied.' },
      { name: 'Priya Gupta',    area: 'Rohini, Delhi',      stars: 5, text: 'Satyanarayan Katha was beautifully arranged. Pandit was punctual and very knowledgeable.' },
      { name: 'Amit Agarwal',   area: 'Laxmi Nagar, Delhi', stars: 4, text: 'Good service overall. Easy booking and pandit was very professional.' },
    ],
    pujari_count: 55, booking_count: '900+', lat: 28.6139, lon: 77.2090,
  },
  {
    slug: 'noida', name_mr: 'नोएडा', name_en: 'Noida',
    state_mr: 'उत्तर प्रदेश', state_en: 'Uttar Pradesh', country: 'india',
    district_mr: 'Gautam Buddha Nagar',
    tagline: 'Book Pandit in Noida & Greater Noida',
    desc: 'Noida & Greater Noida — Book experienced verified pandits for all Hindu puja, havan and rituals at your home. Serving Sector 1–150, Greater Noida, Noida Extension.',
    seo_desc: 'Book pandit online in Noida for puja, havan, griha pravesh. Verified pandits near me in Noida.',
    keywords: 'pandit noida, puja booking noida, book pandit noida, satyanarayan puja noida',
    popular_pujas: ['Satyanarayan Puja', 'Griha Pravesh', 'Vastu Shanti', 'Havan', 'Katha'],
    areas: ['Sector 18', 'Sector 50', 'Sector 62', 'Sector 137', 'Greater Noida', 'Noida Extension'],
    testimonials: [
      { name: 'Deepak Verma',   area: 'Sector 50, Noida',  stars: 5, text: 'Very good pandit for Satyanarayan Puja. Completed all rituals perfectly on time.' },
      { name: 'Neha Srivastava', area: 'Greater Noida',    stars: 5, text: 'Griha Pravesh was a memorable experience. The pandit was very professional and helpful.' },
      { name: 'Rohit Chauhan',  area: 'Sector 137, Noida', stars: 4, text: 'Smooth booking process. Pandit arrived on time and performed havan properly.' },
    ],
    pujari_count: 30, booking_count: '400+', lat: 28.5355, lon: 77.3910,
  },

  // ═══════════════════════════════════════
  //  UTTAR PRADESH — PILGRIMAGE CITIES
  // ═══════════════════════════════════════
  {
    slug: 'varanasi', name_mr: 'वाराणसी', name_en: 'Varanasi',
    state_mr: 'उत्तर प्रदेश', state_en: 'Uttar Pradesh', country: 'india',
    district_mr: 'Varanasi',
    tagline: 'Book Pandit in Varanasi (Kashi) for All Rituals',
    desc: 'Varanasi (Kashi / Banaras) — the spiritual capital of India. Book experienced Kashi pandits for Kashi Vishwanath rituals, Pind Daan, Rudrabhishek, Puja at Ghat and all Vedic ceremonies.',
    seo_desc: 'Book pandit in Varanasi for puja, Kashi Vishwanath rituals, Pind Daan, Ganga snan. Expert Varanasi pandits.',
    keywords: 'pandit varanasi, puja booking kashi, pandit kashi, pind daan varanasi, kashi vishwanath pooja, banaras pandit',
    popular_pujas: ['Rudrabhishek', 'Pind Daan', 'Kashi Vishwanath Puja', 'Tripindi Shraddha', 'Ganga Puja', 'Havan'],
    areas: ['Assi Ghat', 'Dashashwamedh Ghat', 'Manikarnika Ghat', 'Sarnath', 'Lanka', 'Sigra', 'Varanasi Cantonment'],
    testimonials: [
      { name: 'Suresh Tiwari',  area: 'Assi Ghat, Varanasi',  stars: 5, text: 'Authentic Pind Daan rituals performed by the pandit. Very knowledgeable in Vedic procedures. Highly recommended.' },
      { name: 'Kavita Mishra',  area: 'Dashashwamedh, Varanasi', stars: 5, text: 'Kashi Vishwanath puja was arranged perfectly. The pandit guided us through every step.' },
      { name: 'Arun Sharma',    area: 'Sarnath, Varanasi',    stars: 5, text: 'Excellent Rudrabhishek ceremony. Everything was arranged as per the Vedic tradition.' },
    ],
    pujari_count: 40, booking_count: '700+', lat: 25.3176, lon: 82.9739,
  },
  {
    slug: 'prayagraj', name_mr: 'प्रयागराज', name_en: 'Prayagraj',
    state_mr: 'उत्तर प्रदेश', state_en: 'Uttar Pradesh', country: 'india',
    district_mr: 'Prayagraj',
    tagline: 'Book Pandit in Prayagraj (Allahabad) for Puja',
    desc: 'Prayagraj — the Triveni Sangam of Ganga, Yamuna and Saraswati. Book experienced pandits for Prayag Kshetra rituals, Pind Daan at Sangam, Kumbh rituals, and all Hindu ceremonies.',
    seo_desc: 'Book pandit in Prayagraj for Sangam Puja, Pind Daan, Kumbh rituals. Expert Allahabad pandits.',
    keywords: 'pandit prayagraj, puja booking allahabad, pandit allahabad, sangam puja, pind daan prayagraj',
    popular_pujas: ['Triveni Sangam Puja', 'Pind Daan', 'Mahalaya Puja', 'Havan', 'Satyanarayan Puja'],
    areas: ['Civil Lines', 'Allahpur', 'Sangam', 'Jhunsi', 'Naini', 'Phaphamau'],
    testimonials: [
      { name: 'Vinod Dubey',    area: 'Sangam, Prayagraj',   stars: 5, text: 'Authentic Pind Daan at Sangam with full rituals. Very knowledgeable pandit. Highly recommend.' },
      { name: 'Meena Singh',    area: 'Civil Lines, Allahabad', stars: 5, text: 'Satyanarayan Katha arranged very well. Pandit was on time and professional.' },
      { name: 'Mahesh Bajpai',  area: 'Allahpur, Prayagraj', stars: 4, text: 'Good havan ceremony. Everything was organized properly. Will book again.' },
    ],
    pujari_count: 35, booking_count: '500+', lat: 25.4358, lon: 81.8463,
  },
  {
    slug: 'mathura', name_mr: 'मथुरा-वृंदावन', name_en: 'Mathura',
    state_mr: 'उत्तर प्रदेश', state_en: 'Uttar Pradesh', country: 'india',
    district_mr: 'Mathura',
    tagline: 'Book Pandit in Mathura-Vrindavan for Krishna Puja',
    desc: 'Mathura-Vrindavan — the birthplace of Lord Krishna. Book experienced pandits for Janmashtami rituals, Govardhan Puja, Radha Krishna puja, parikrama rituals and all Vaishnav ceremonies.',
    seo_desc: 'Book pandit in Mathura Vrindavan for Krishna puja, Janmashtami rituals. Expert Braj Bhumi pandits.',
    keywords: 'pandit mathura, pandit vrindavan, krishna puja mathura, janmashtami puja, govardhan puja booking',
    popular_pujas: ['Radha Krishna Puja', 'Janmashtami Rituals', 'Govardhan Puja', 'Havan', 'Satyanarayan Puja'],
    areas: ['Vrindavan', 'Mathura City', 'Govardhan', 'Barsana', 'Gokul', 'Baldeo'],
    testimonials: [
      { name: 'Sunita Agarwal', area: 'Vrindavan',           stars: 5, text: 'Beautiful Radha Krishna puja arranged for our anniversary. Everything was authentic and devotional.' },
      { name: 'Ramesh Goswami', area: 'Mathura City',        stars: 5, text: 'Janmashtami rituals were performed exactly as per tradition. A spiritually fulfilling experience.' },
      { name: 'Priya Sharma',   area: 'Govardhan',           stars: 4, text: 'Govardhan Puja was arranged perfectly. The pandit was very cooperative and helpful.' },
    ],
    pujari_count: 30, booking_count: '450+', lat: 27.4924, lon: 77.6737,
  },
  {
    slug: 'lucknow', name_mr: 'लखनऊ', name_en: 'Lucknow',
    state_mr: 'उत्तर प्रदेश', state_en: 'Uttar Pradesh', country: 'india',
    district_mr: 'Lucknow',
    tagline: 'Book Pandit in Lucknow for Puja & Havan',
    desc: 'Lucknow — the City of Nawabs. Book experienced verified pandits for Griha Pravesh, Satyanarayan Puja, Havan, Vivah rituals and all Hindu ceremonies across Lucknow.',
    seo_desc: 'Book pandit online in Lucknow for puja, havan. Verified pandits near me in Lucknow.',
    keywords: 'pandit lucknow, puja booking lucknow, book pandit lucknow, satyanarayan puja lucknow',
    popular_pujas: ['Satyanarayan Puja', 'Griha Pravesh', 'Navratri Puja', 'Havan', 'Kanya Puja'],
    areas: ['Hazratganj', 'Gomtinagar', 'Alambagh', 'Indiranagar', 'Aliganj', 'Charbagh'],
    testimonials: [
      { name: 'Rajeev Mishra',  area: 'Gomtinagar, Lucknow', stars: 5, text: 'Excellent pandit for Griha Pravesh puja. Everything was done with proper Vedic procedures.' },
      { name: 'Shweta Gupta',   area: 'Indiranagar, Lucknow',stars: 5, text: 'Satyanarayan Katha was beautifully conducted. The pandit was very experienced.' },
      { name: 'Ankit Verma',    area: 'Hazratganj, Lucknow', stars: 4, text: 'Smooth booking and timely service. Pandit was knowledgeable and cooperative.' },
    ],
    pujari_count: 28, booking_count: '380+', lat: 26.8467, lon: 80.9462,
  },

  // ═══════════════════════════════════════
  //  KARNATAKA
  // ═══════════════════════════════════════
  {
    slug: 'bangalore', name_mr: 'बेंगळुरू', name_en: 'Bangalore',
    state_mr: 'कर्नाटक', state_en: 'Karnataka', country: 'india',
    district_mr: 'Bengaluru',
    tagline: 'Book Pandit in Bangalore for Puja & Havan',
    desc: 'Bengaluru — Silicon Valley of India. Book experienced, verified pandits for Griha Pravesh, Satyanarayan Puja, Havan, Vastu Shanti and all Hindu ceremonies at your home or office.',
    seo_desc: 'Book pandit online in Bangalore for puja, havan, griha pravesh. Verified pandits near me in Bengaluru.',
    keywords: 'pandit bangalore, puja booking bangalore, pandit near me bangalore, book pandit bengaluru, satyanarayan puja bangalore',
    popular_pujas: ['Satyanarayan Puja', 'Griha Pravesh', 'Havan', 'Vastu Shanti', 'Ganesh Chaturthi Puja'],
    areas: ['Koramangala', 'Indiranagar', 'Whitefield', 'Jayanagar', 'BTM Layout', 'HSR Layout', 'Hebbal', 'Marathahalli'],
    testimonials: [
      { name: 'Ramesh Iyengar',  area: 'Koramangala, Bangalore', stars: 5, text: 'Found an excellent pandit for our Griha Pravesh. On time, well-versed in all rituals. Highly recommend!' },
      { name: 'Priya Sharma',    area: 'Whitefield, Bangalore',  stars: 5, text: 'Satyanarayan Puja was performed beautifully. The pandit was very knowledgeable.' },
      { name: 'Vikram Nair',     area: 'Indiranagar, Bangalore', stars: 4, text: 'Great service for our havan ceremony. Easy booking process and professional pandit.' },
    ],
    pujari_count: 38, booking_count: '550+', lat: 12.9716, lon: 77.5946,
  },

  // ═══════════════════════════════════════
  //  TELANGANA
  // ═══════════════════════════════════════
  {
    slug: 'hyderabad', name_mr: 'हैदराबाद', name_en: 'Hyderabad',
    state_mr: 'तेलंगणा', state_en: 'Telangana', country: 'india',
    district_mr: 'Hyderabad',
    tagline: 'Book Pandit in Hyderabad for Puja & Havan',
    desc: 'Hyderabad — City of Pearls. Book experienced verified pandits for all Hindu pujas, havans and rituals across Hyderabad, Secunderabad and Cyberabad.',
    seo_desc: 'Book pandit online in Hyderabad for puja, havan, griha pravesh. Verified pandits near me in Hyderabad.',
    keywords: 'pandit hyderabad, puja booking hyderabad, book pandit hyderabad, satyanarayan puja hyderabad',
    popular_pujas: ['Satyanarayan Puja', 'Griha Pravesh', 'Ganesh Chaturthi', 'Havan', 'Vastu Puja'],
    areas: ['Banjara Hills', 'Jubilee Hills', 'Hitech City', 'Secunderabad', 'Kukatpally', 'LB Nagar'],
    testimonials: [
      { name: 'Suresh Reddy',   area: 'Banjara Hills, Hyderabad', stars: 5, text: 'Excellent pandit for Griha Pravesh. Professional and very knowledgeable. Highly recommended.' },
      { name: 'Lakshmi Rao',    area: 'Hitech City, Hyderabad',   stars: 5, text: 'Satyanarayan Puja was performed very well. Pandit was on time and cooperative.' },
      { name: 'Ravi Kumar',     area: 'Kukatpally, Hyderabad',    stars: 4, text: 'Good service for our havan. Everything was arranged properly. Will book again.' },
    ],
    pujari_count: 32, booking_count: '480+', lat: 17.3850, lon: 78.4867,
  },

  // ═══════════════════════════════════════
  //  TAMIL NADU
  // ═══════════════════════════════════════
  {
    slug: 'chennai', name_mr: 'चेन्नई', name_en: 'Chennai',
    state_mr: 'तामिळनाडू', state_en: 'Tamil Nadu', country: 'india',
    district_mr: 'Chennai',
    tagline: 'Book Pandit in Chennai for Puja & Rituals',
    desc: 'Chennai — Gateway of South India. Book experienced pandits for all Hindu pujas, temple rituals, Griha Pravesh, Havan and Vedic ceremonies across Chennai.',
    seo_desc: 'Book pandit online in Chennai for puja, havan, griha pravesh. Verified pandits near me in Chennai.',
    keywords: 'pandit chennai, puja booking chennai, book pandit chennai, satyanarayan puja chennai',
    popular_pujas: ['Satyanarayan Puja', 'Griha Pravesh', 'Ayudha Puja', 'Havan', 'Navaratri Puja'],
    areas: ['T. Nagar', 'Anna Nagar', 'Velachery', 'Adyar', 'Tambaram', 'Chromepet', 'OMR', 'Porur'],
    testimonials: [
      { name: 'Anand Iyer',     area: 'T. Nagar, Chennai',   stars: 5, text: 'Very knowledgeable pandit for our Griha Pravesh. All rituals were authentic. Highly recommended.' },
      { name: 'Kavitha Rajan',  area: 'Anna Nagar, Chennai', stars: 5, text: 'Satyanarayan Puja was beautifully conducted. Pandit was professional and devout.' },
      { name: 'Suresh Kumar',   area: 'OMR, Chennai',        stars: 4, text: 'Good pandit for our havan. Timely service and all rituals performed properly.' },
    ],
    pujari_count: 28, booking_count: '400+', lat: 13.0827, lon: 80.2707,
  },

  // ═══════════════════════════════════════
  //  WEST BENGAL
  // ═══════════════════════════════════════
  {
    slug: 'kolkata', name_mr: 'कोलकाता', name_en: 'Kolkata',
    state_mr: 'पश्चिम बंगाल', state_en: 'West Bengal', country: 'india',
    district_mr: 'Kolkata',
    tagline: 'Book Pandit in Kolkata for Puja & Rituals',
    desc: 'Kolkata — City of Joy. Book experienced pandits for Durga Puja, Kali Puja, Satyanarayan Puja, Griha Pravesh and all Hindu ceremonies across Kolkata.',
    seo_desc: 'Book pandit online in Kolkata for puja, Durga puja, Kali puja, Griha pravesh. Verified pandits near me in Kolkata.',
    keywords: 'pandit kolkata, puja booking kolkata, durga puja booking, kali puja pandit kolkata',
    popular_pujas: ['Durga Puja', 'Kali Puja', 'Satyanarayan Puja', 'Griha Pravesh', 'Lakshmi Puja'],
    areas: ['South Kolkata', 'North Kolkata', 'Salt Lake', 'New Town', 'Howrah', 'Dum Dum', 'Behala'],
    testimonials: [
      { name: 'Subrata Ghosh',  area: 'Salt Lake, Kolkata',  stars: 5, text: 'Excellent pandit for our Griha Pravesh. All rituals as per Bengali tradition. Very satisfied.' },
      { name: 'Puja Banerjee',  area: 'South Kolkata',       stars: 5, text: 'Satyanarayan Katha was beautifully arranged. Pandit was on time and very knowledgeable.' },
      { name: 'Rajib Das',      area: 'New Town, Kolkata',   stars: 4, text: 'Good service for Lakshmi Puja. Pandit arrived on time and performed all rituals properly.' },
    ],
    pujari_count: 35, booking_count: '520+', lat: 22.5726, lon: 88.3639,
  },

  // ═══════════════════════════════════════
  //  GUJARAT
  // ═══════════════════════════════════════
  {
    slug: 'ahmedabad', name_mr: 'अहमदाबाद', name_en: 'Ahmedabad',
    state_mr: 'गुजरात', state_en: 'Gujarat', country: 'india',
    district_mr: 'Ahmedabad',
    tagline: 'Book Pandit in Ahmedabad for Puja & Havan',
    desc: 'Ahmedabad — Manchester of the East. Book experienced verified pandits for Griha Pravesh, Satyanarayan Puja, Havan, Navratri rituals and all Hindu ceremonies across Ahmedabad.',
    seo_desc: 'Book pandit online in Ahmedabad for puja, havan, navratri puja. Verified pandits near me in Ahmedabad.',
    keywords: 'pandit ahmedabad, puja booking ahmedabad, book pandit ahmedabad, navratri puja ahmedabad',
    popular_pujas: ['Satyanarayan Puja', 'Griha Pravesh', 'Navratri Puja', 'Havan', 'Ganesh Chaturthi'],
    areas: ['Navrangpura', 'Bopal', 'SG Highway', 'Prahlad Nagar', 'Vastrapur', 'Satellite', 'Nikol', 'Gota'],
    testimonials: [
      { name: 'Mihir Patel',    area: 'Navrangpura, Ahmedabad', stars: 5, text: 'Very good pandit for our Griha Pravesh. Professional, punctual and knowledgeable.' },
      { name: 'Hetal Shah',     area: 'Bopal, Ahmedabad',       stars: 5, text: 'Satyanarayan Katha performed beautifully. Highly recommend this service.' },
      { name: 'Rajesh Desai',   area: 'SG Highway, Ahmedabad',  stars: 4, text: 'Good havan ceremony arranged. All rituals were conducted properly.' },
    ],
    pujari_count: 30, booking_count: '450+', lat: 23.0225, lon: 72.5714,
  },

  // ═══════════════════════════════════════
  //  RAJASTHAN
  // ═══════════════════════════════════════
  {
    slug: 'jaipur', name_mr: 'जयपूर', name_en: 'Jaipur',
    state_mr: 'राजस्थान', state_en: 'Rajasthan', country: 'india',
    district_mr: 'Jaipur',
    tagline: 'Book Pandit in Jaipur (Pink City) for Puja',
    desc: 'Jaipur — the Pink City of India. Book experienced pandits for all Hindu pujas, havans, Griha Pravesh and Vedic ceremonies across Jaipur.',
    seo_desc: 'Book pandit online in Jaipur for puja, havan, griha pravesh. Verified pandits near me in Jaipur.',
    keywords: 'pandit jaipur, puja booking jaipur, book pandit jaipur, satyanarayan puja jaipur',
    popular_pujas: ['Satyanarayan Puja', 'Griha Pravesh', 'Havan', 'Vivah Puja', 'Navratri Puja'],
    areas: ['Malviya Nagar', 'Mansarovar', 'Vaishali Nagar', 'Tonk Road', 'Ajmer Road', 'Civil Lines'],
    testimonials: [
      { name: 'Sunil Sharma',   area: 'Malviya Nagar, Jaipur', stars: 5, text: 'Excellent pandit for our Griha Pravesh. All Rajasthani rituals performed authentically.' },
      { name: 'Rekha Agarwal',  area: 'Mansarovar, Jaipur',    stars: 5, text: 'Satyanarayan Katha was arranged very well. Pandit was on time and professional.' },
      { name: 'Vikas Gupta',    area: 'Vaishali Nagar, Jaipur',stars: 4, text: 'Good havan ceremony. Pandit was knowledgeable and helpful. Will book again.' },
    ],
    pujari_count: 25, booking_count: '350+', lat: 26.9124, lon: 75.7873,
  },

  // ═══════════════════════════════════════
  //  MADHYA PRADESH
  // ═══════════════════════════════════════
  {
    slug: 'ujjain', name_mr: 'उज्जैन', name_en: 'Ujjain',
    state_mr: 'मध्य प्रदेश', state_en: 'Madhya Pradesh', country: 'india',
    district_mr: 'Ujjain',
    tagline: 'Book Pandit in Ujjain — Mahakaleshwar Rituals',
    desc: 'Ujjain — the city of Mahakaleshwar Jyotirlinga. Book experienced pandits for Mahakal rituals, Rudrabhishek, Simhastha rituals, Pind Daan and all Vedic ceremonies.',
    seo_desc: 'Book pandit in Ujjain for Mahakaleshwar puja, Rudrabhishek, Simhastha rituals. Expert Ujjain pandits.',
    keywords: 'pandit ujjain, mahakaleshwar puja ujjain, rudrabhishek ujjain, simhastha ujjain pandit',
    popular_pujas: ['Mahakaleshwar Puja', 'Rudrabhishek', 'Pind Daan', 'Havan', 'Satyanarayan Puja'],
    areas: ['Mahakal Temple', 'Nanakheda', 'Freeganj', 'Dewas Gate', 'Vikram Nagar'],
    testimonials: [
      { name: 'Vivek Joshi',    area: 'Mahakal Temple, Ujjain', stars: 5, text: 'Authentic Rudrabhishek at Mahakaleshwar. Very experienced pandit, deeply knowledgeable.' },
      { name: 'Anita Sharma',   area: 'Nanakheda, Ujjain',      stars: 5, text: 'Pind Daan at Ujjain performed with full Vedic procedure. A very sacred experience.' },
      { name: 'Mahesh Tiwari',  area: 'Freeganj, Ujjain',       stars: 5, text: 'Excellent havan ceremony. The pandit explained every ritual clearly. Highly recommend.' },
    ],
    pujari_count: 28, booking_count: '420+', lat: 23.1828, lon: 75.7772,
  },
  {
    slug: 'indore', name_mr: 'इंदूर', name_en: 'Indore',
    state_mr: 'मध्य प्रदेश', state_en: 'Madhya Pradesh', country: 'india',
    district_mr: 'Indore',
    tagline: 'Book Pandit in Indore for Puja & Havan',
    desc: 'Indore — the commercial capital of Madhya Pradesh. Book experienced verified pandits for Griha Pravesh, Satyanarayan Puja, Havan and all Hindu ceremonies across Indore.',
    seo_desc: 'Book pandit online in Indore for puja, havan. Verified pandits near me in Indore.',
    keywords: 'pandit indore, puja booking indore, book pandit indore, satyanarayan puja indore',
    popular_pujas: ['Satyanarayan Puja', 'Griha Pravesh', 'Havan', 'Vastu Shanti', 'Ganesh Puja'],
    areas: ['Vijay Nagar', 'Rajwada', 'Palasia', 'LIG Colony', 'Scheme 54', 'Super Corridor'],
    testimonials: [
      { name: 'Ravi Pandey',    area: 'Vijay Nagar, Indore',  stars: 5, text: 'Very good pandit for Griha Pravesh. All rituals done with proper procedure.' },
      { name: 'Sonal Choubey',  area: 'Palasia, Indore',      stars: 5, text: 'Satyanarayan Katha was beautifully arranged. Pandit was knowledgeable and devotional.' },
      { name: 'Gaurav Mishra',  area: 'LIG Colony, Indore',   stars: 4, text: 'Good service overall. Easy booking and timely pandit. Will book again.' },
    ],
    pujari_count: 22, booking_count: '320+', lat: 22.7196, lon: 75.8577,
  },

  // ═══════════════════════════════════════
  //  KERALA
  // ═══════════════════════════════════════
  {
    slug: 'kochi', name_mr: 'कोची', name_en: 'Kochi',
    state_mr: 'केरळ', state_en: 'Kerala', country: 'india',
    district_mr: 'Ernakulam',
    tagline: 'Book Pandit in Kochi (Cochin) for Puja',
    desc: 'Kochi — Queen of the Arabian Sea. Book experienced pandits for Griha Pravesh, Satyanarayan Puja, Havan and all Hindu ceremonies across Kochi, Ernakulam and Thrissur.',
    seo_desc: 'Book pandit online in Kochi for puja, havan, griha pravesh. Verified pandits near me in Cochin.',
    keywords: 'pandit kochi, puja booking kochi, pandit ernakulam, book pandit cochin',
    popular_pujas: ['Satyanarayan Puja', 'Griha Pravesh', 'Havan', 'Satyanarayana Puja', 'Navaratri Puja'],
    areas: ['Kakkanad', 'Edapally', 'Aluva', 'Thrippunithura', 'Thrissur', 'Marine Drive', 'Fort Kochi'],
    testimonials: [
      { name: 'Rajesh Menon',   area: 'Kakkanad, Kochi',     stars: 5, text: 'Excellent pandit for our Griha Pravesh. Very knowledgeable and professional.' },
      { name: 'Geetha Nair',    area: 'Edapally, Kochi',     stars: 5, text: 'Satyanarayan Puja was perfectly arranged. Pandit was punctual and devoted.' },
      { name: 'Suresh Pillai',  area: 'Aluva, Ernakulam',    stars: 4, text: 'Good havan ceremony. All rituals were conducted properly. Will book again.' },
    ],
    pujari_count: 20, booking_count: '280+', lat: 9.9312, lon: 76.2673,
  },

  // ═══════════════════════════════════════
  //  PUNJAB
  // ═══════════════════════════════════════
  {
    slug: 'amritsar', name_mr: 'अमृतसर', name_en: 'Amritsar',
    state_mr: 'पंजाब', state_en: 'Punjab', country: 'india',
    district_mr: 'Amritsar',
    tagline: 'Book Pandit in Amritsar for Puja & Havan',
    desc: 'Amritsar — the Holy City. Book experienced pandits for Griha Pravesh, Satyanarayan Puja, Havan, Wedding rituals and all Hindu ceremonies across Amritsar.',
    seo_desc: 'Book pandit online in Amritsar for puja, havan, griha pravesh. Verified pandits near me in Amritsar.',
    keywords: 'pandit amritsar, puja booking amritsar, book pandit amritsar, satyanarayan puja amritsar',
    popular_pujas: ['Satyanarayan Puja', 'Griha Pravesh', 'Havan', 'Sundarkand Path', 'Vivah Puja'],
    areas: ['Lawrence Road', 'Ranjit Avenue', 'Civil Lines', 'Green Avenue', 'Majitha Road'],
    testimonials: [
      { name: 'Harpreet Singh',  area: 'Ranjit Avenue, Amritsar', stars: 5, text: 'Very good pandit for our havan ceremony. All rituals performed properly.' },
      { name: 'Simran Kaur',     area: 'Civil Lines, Amritsar',   stars: 5, text: 'Satyanarayan Puja was beautifully arranged. Pandit was professional and devout.' },
      { name: 'Gurdeep Sharma',  area: 'Lawrence Road, Amritsar', stars: 4, text: 'Good service for Griha Pravesh. Pandit arrived on time and was cooperative.' },
    ],
    pujari_count: 18, booking_count: '240+', lat: 31.6340, lon: 74.8723,
  },
];

// Fast lookup by slug
const BY_SLUG = Object.fromEntries(CITIES.map(c => [c.slug, c]));

// Group by state for CitiesIndex
const BY_STATE = CITIES.reduce((acc, city) => {
  const key = city.state_en;
  if (!acc[key]) acc[key] = { state_en: city.state_en, state_mr: city.state_mr, cities: [] };
  acc[key].cities.push(city);
  return acc;
}, {});

module.exports = { CITIES, BY_SLUG, BY_STATE };
