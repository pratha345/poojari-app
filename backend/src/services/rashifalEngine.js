// src/services/rashifalEngine.js — राशिभविष्य from real gochar (no AI)
//
// Every prediction is built from the actual sidereal positions (gocharService) and the
// classical gochar results counted from the Moon sign. The sentences below are the standard
// gochar phala (Phaladeepika ch. 26 / Muhurta Chintamani), written once in plain Marathi.
// Each response also returns `basis`, so the page can show what the prediction rests on.

const g = require('./gocharService');

const IST = 330 * 60000;
const RASHIS = g.RASHIS;
const MONTHS_MR = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
const DAYS_MR = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

// ── Gochar phala: PHALA[planet][house-1] ───────────────────────────────
const PHALA = {
  Moon: [
    'मन प्रसन्न राहील, आरोग्य चांगले; आवडते भोजन व कौटुंबिक सुख मिळेल.',
    'खर्च वाढू शकतो, कामात अडथळे येतील; बोलताना संयम ठेवा.',
    'उत्साह व धैर्य वाढेल, कामात यश मिळेल; भावंडांची साथ लाभेल.',
    'मनात अस्वस्थता किंवा चिंता राहील; घरगुती कामांत धीर धरा.',
    'निर्णयात गोंधळ, मुलांबद्दल काळजी; महत्त्वाचे निर्णय पुढे ढकला.',
    'आरोग्य व आर्थिक बाजू चांगली राहील; विरोधकांवर मात कराल.',
    'जोडीदाराशी सौख्य, भेटीगाठी आणि लाभ होतील.',
    'चंद्राष्टम — मन अस्थिर, थकवा जाणवेल; महत्त्वाची कामे, मोठे व्यवहार व वाद टाळा.',
    'कामात विलंब आणि थकवा; श्रद्धा व संयम ठेवा.',
    'कामात यश व मान-सन्मान; हाती घेतलेली कामे पूर्ण होतील.',
    'लाभ, आनंद आणि मित्रांकडून सहकार्य मिळेल.',
    'खर्च वाढतील, झोप अपुरी राहू शकते; पैशांचे व्यवहार जपून करा.',
  ],
  Sun: [
    'थकवा, चिडचिड आणि दगदग; आरोग्याकडे लक्ष द्या.',
    'आर्थिक नुकसानाचा संभव, डोळ्यांची काळजी घ्या; बोलण्यात कटुता टाळा.',
    'नवे पद किंवा जबाबदारी, आरोग्य उत्तम, विरोधकांवर विजय.',
    'घरगुती मतभेद व मानसिक ताण; प्रकृतीकडे लक्ष द्या.',
    'मन अशांत, मुलांबद्दल काळजी; अधिकाऱ्यांशी वाद टाळा.',
    'आजारांपासून मुक्ती, विरोधकांवर मात, कामात यश.',
    'प्रवासाची दगदग, जोडीदाराशी मतभेद; पोटाची काळजी घ्या.',
    'आरोग्याच्या तक्रारी, सरकारी कामांत अडचणी; धोका पत्करू नका.',
    'कामात अडथळे, वडीलधाऱ्यांशी मतभेद; धीर धरा.',
    'कामात यश, मान-सन्मान आणि प्रगती.',
    'आर्थिक लाभ, मान-सन्मान आणि चांगले आरोग्य.',
    'खर्च वाढतील, मित्रांशी गैरसमज; प्रवासात काळजी घ्या.',
  ],
  Mars: [
    'राग व उतावळेपणा वाढू शकतो; रक्तदाब व इजा यांची काळजी घ्या.',
    'पैशांचा अपव्यय, कुटुंबात वाद; शब्द जपून वापरा.',
    'धैर्य, उत्साह व यश; जमीन-जुमल्याच्या कामांत लाभ.',
    'घरात तणाव, मालमत्तेचे प्रश्न; पोटाच्या तक्रारी संभवतात.',
    'मुलांबद्दल काळजी; उतावळे निर्णय टाळा.',
    'विरोधकांवर विजय, आरोग्य सुधारेल, कामात यश.',
    'जोडीदाराशी वाद संभवतात; भागीदारीत सावध राहा.',
    'अपघात व इजेपासून जपा; वाहन सावकाश चालवा.',
    'थकवा, अपमानाचा प्रसंग; खर्चावर नियंत्रण ठेवा.',
    'कामात ताण व स्पर्धा; वरिष्ठांशी वाद टाळा.',
    'आर्थिक लाभ, जमीन-मालमत्तेत यश, आरोग्य चांगले.',
    'अनावश्यक खर्च, डोळे व झोपेची तक्रार; वाद टाळा.',
  ],
  Mercury: [
    'चुकीच्या संगतीमुळे नुकसान संभवते; व्यवहार काळजीपूर्वक करा.',
    'धनलाभ, बोलण्यातून कामे होतील; शिक्षणात प्रगती.',
    'विरोधकांकडून त्रास, मित्रांशी गैरसमज; कागदपत्रे नीट तपासा.',
    'कुटुंबात सौख्य, आर्थिक लाभ आणि नवे संपर्क.',
    'जोडीदार व मुलांशी मतभेद; विचारपूर्वक बोला.',
    'व्यवसायात यश, प्रतिष्ठा वाढेल, स्पर्धेत पुढे राहाल.',
    'भागीदारीत वाद संभवतात; करार काळजीपूर्वक करा.',
    'अनपेक्षित लाभ, कामात यश, बुद्धीचा योग्य उपयोग.',
    'कामात अडथळे, प्रवासात विलंब; संयम ठेवा.',
    'व्यवसाय-नोकरीत यश, सौख्य आणि मान.',
    'लाभ, नवे संबंध आणि आनंदाची बातमी.',
    'खर्च व नुकसानाचा संभव; कागदोपत्री व्यवहारांत सावध राहा.',
  ],
  Venus: [
    'सुख-सोयी, आनंद आणि प्रेमात गोडवा.',
    'धनलाभ, कौटुंबिक आनंद आणि मधुर संवाद.',
    'मान-सन्मान, प्रगती आणि नव्या ओळखी.',
    'मित्र-परिवारासोबत आनंद, घरात सुख.',
    'मुलांकडून आनंद, प्रेमसंबंधांत गोडवा, लाभ.',
    'नात्यांत गैरसमज, विरोधकांपासून त्रास; संयम ठेवा.',
    'जोडीदाराशी मतभेद किंवा नात्यात ताण; समजूतदारपणा ठेवा.',
    'अनपेक्षित धनलाभ, सुख-सोयी वाढतील.',
    'धार्मिक कार्ये, भाग्याची साथ आणि आनंद.',
    'कामाच्या ठिकाणी वाद, मानहानीचा संभव; व्यवहार जपून करा.',
    'आर्थिक लाभ, मित्रांकडून आनंद.',
    'सुख-सोयींवर खर्च होईल, पण लाभही; आरामदायी काळ.',
  ],
  Jupiter: [
    'स्थानबदल, खर्च आणि मनात अस्वस्थता; निर्णय विचारपूर्वक घ्या.',
    'धनलाभ, कौटुंबिक सौख्य आणि वाणीला मान.',
    'कामात अडथळे, स्थानबदलाचा संभव; प्रयत्न वाढवावे लागतील.',
    'कौटुंबिक चिंता, घर-वाहनाच्या प्रश्नांत अडचणी.',
    'संततिसुख, बुद्धी व शिक्षणात प्रगती, शुभ कार्ये.',
    'विरोधकांचा त्रास, आरोग्याच्या तक्रारी; कर्ज टाळा.',
    'विवाहयोग, जोडीदाराचे सौख्य, भागीदारीत लाभ.',
    'अडचणींचा काळ; आरोग्य व आर्थिक बाबतीत सावधगिरी आवश्यक.',
    'भाग्योदय, धार्मिक कार्ये, वडीलधाऱ्यांचा आशीर्वाद.',
    'कामात बदल किंवा ताण, प्रतिष्ठेबद्दल काळजी; धीर धरा.',
    'लाभ, मान-सन्मान आणि इच्छापूर्ती.',
    'खर्च, प्रवास आणि दगदग; धार्मिक कार्यांवर खर्च होईल.',
  ],
  Saturn: [
    'साडेसातीचा मधला टप्पा — दगदग, आरोग्याच्या तक्रारी, कामात विलंब; शिस्त व संयम ठेवा.',
    'साडेसातीचा शेवटचा टप्पा — आर्थिक ताण, कौटुंबिक मतभेद; बचतीवर भर द्या.',
    'कष्टाचे फळ, आर्थिक लाभ, आरोग्य चांगले.',
    'अडीचकी — घरगुती अडचणी, मालमत्तेचे प्रश्न, मानसिक ताण.',
    'मुलांबद्दल चिंता, निर्णयात गोंधळ; गुंतवणूक जपून करा.',
    'विरोधकांवर विजय, आरोग्य सुधारेल, कष्टातून लाभ.',
    'प्रवासाची दगदग, जोडीदाराशी मतभेद; नाती जपा.',
    'अष्टम शनी (अडीचकी) — अडथळे व आरोग्याच्या तक्रारी; धोका पत्करू नका.',
    'भाग्यात विलंब, धार्मिक कार्यांत अडथळे; प्रयत्न सोडू नका.',
    'कामाचा भार वाढेल, प्रतिष्ठेबद्दल काळजी; प्रामाणिक कष्ट करा.',
    'उत्पन्नात वाढ, कष्टाचे फळ, जुनी कामे मार्गी लागतील.',
    'साडेसातीचा पहिला टप्पा — खर्च वाढतील; झोप व मनःशांतीकडे लक्ष द्या.',
  ],
  Rahu: [
    'मनात गोंधळ व अस्वस्थता; घाईचे निर्णय टाळा.',
    'आर्थिक चढ-उतार, कुटुंबात गैरसमज; बोलताना सावध राहा.',
    'धाडस, यश आणि अनपेक्षित लाभ.',
    'घरात अशांतता, मानसिक ताण.',
    'मुलांबद्दल काळजी; सट्टा-जुगार टाळा.',
    'विरोधकांवर मात, आरोग्य सुधारेल, स्पर्धेत यश.',
    'नात्यांत गैरसमज; भागीदारीत सावधगिरी.',
    'अचानक अडचणी; आरोग्याकडे लक्ष द्या.',
    'भाग्यात अडथळे, वडीलधाऱ्यांशी मतभेद.',
    'कामात अस्थिरता, बदलाचे विचार; विचारपूर्वक पावले उचला.',
    'अनपेक्षित लाभ, इच्छापूर्ती.',
    'अनावश्यक खर्च, झोपेची तक्रार; दूरच्या प्रवासाचे योग.',
  ],
  Ketu: [
    'आरोग्य व मनःस्थितीकडे लक्ष द्या; अध्यात्माकडे ओढा राहील.',
    'कौटुंबिक मतभेद, खर्च; बोलण्यात संयम ठेवा.',
    'धैर्य, यश आणि अडचणींवर मात.',
    'घरगुती अस्वस्थता, मातेच्या आरोग्याची काळजी.',
    'मुलांबद्दल काळजी, निर्णयात गोंधळ.',
    'विरोधकांवर मात, आरोग्य सुधारेल.',
    'जोडीदाराशी अंतर किंवा गैरसमज; संवाद ठेवा.',
    'अचानक अडचणी; इजेपासून जपा.',
    'भाग्यात विलंब, धार्मिक कार्यांची ओढ.',
    'कामात अडथळे, मन अस्थिर.',
    'लाभ आणि इच्छापूर्ती.',
    'खर्च, अध्यात्म व तीर्थयात्रेचे योग.',
  ],
};

// traditional upasana for a planet giving adverse results
const UPAY = {
  Moon:    'शंकराला जलाभिषेक करा, "ॐ नमः शिवाय" जप करा.',
  Sun:     'सकाळी सूर्याला अर्घ्य द्या, आदित्यहृदय स्तोत्र म्हणा.',
  Mars:    'मारुतीचे दर्शन घ्या, हनुमान चालीसा म्हणा.',
  Mercury: 'गणपतीला दूर्वा वाहा, विष्णुसहस्रनाम ऐका.',
  Jupiter: 'दत्तगुरूंचे स्मरण करा, ज्येष्ठांचा आशीर्वाद घ्या.',
  Venus:   'श्रीसूक्त म्हणा किंवा लक्ष्मीची उपासना करा.',
  Saturn:  'मारुतीचे दर्शन घ्या, गरजूंना मदत करा.',
  Rahu:    'दुर्गादेवीची उपासना करा.',
  Ketu:    'गणपतीची उपासना करा.',
};
const UPAY_DEFAULT = 'इष्टदेवतेचे स्मरण करून दिवसाची सुरुवात करा.';

const ORDINAL = ['पहिल्या', 'दुसऱ्या', 'तिसऱ्या', 'चौथ्या', 'पाचव्या', 'सहाव्या', 'सातव्या', 'आठव्या', 'नवव्या', 'दहाव्या', 'अकराव्या', 'बाराव्या'];
const P = g.PLANETS;

// "गुरू सिंह राशीत (५व्या स्थानी)"-style phrase + phala sentence
function phala(key, house) { return PHALA[key][house - 1]; }
function where(key, rashi, house) {
  return house === 1 ? `${P[key].mr} आपल्याच राशीत (${RASHIS[rashi]})` : `${P[key].mr} ${RASHIS[rashi]} राशीत — ${ORDINAL[house - 1]} स्थानी`;
}

// ── time helpers (IST) ─────────────────────────────────────────────────
const at = (ymd, hm = '06:00') => new Date(`${ymd}T${hm}:00+05:30`);
const istYMD = (d) => new Date(d.getTime() + IST).toISOString().slice(0, 10);
const istHM = (d) => {
  const x = new Date(d.getTime() + IST);
  const h = x.getUTCHours(), m = x.getUTCMinutes();
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
const addDays = (ymd, n) => new Date(Date.parse(ymd + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const todayIST = () => istYMD(new Date());
const dateMR = (ymd) => { const [y, m, d] = ymd.split('-').map(Number); return `${d} ${MONTHS_MR[m - 1]} ${y}`; };
const dayMR = (ymd) => DAYS_MR[new Date(ymd + 'T00:00:00Z').getUTCDay()];

// ── scoring ────────────────────────────────────────────────────────────
const DAY_WEIGHT   = { Moon: 4, Jupiter: 2, Saturn: 2, Sun: 1, Mars: 1, Mercury: 1, Venus: 1, Rahu: 0.5, Ketu: 0.5 };
const MONTH_WEIGHT = { Sun: 2, Mars: 1.5, Mercury: 1.5, Venus: 1.5, Jupiter: 2, Saturn: 2, Rahu: 0.5, Ketu: 0.5 };
const YEAR_WEIGHT  = { Jupiter: 3, Saturn: 3, Rahu: 1, Ketu: 1 };

function grade(goodWeight, total, chandrashtama = false) {
  let score = Math.round(1 + (9 * goodWeight) / total);
  if (chandrashtama) score = Math.min(score, 3);
  if (score >= 8) return { score, scoreLabel: 'उत्तम', quality: 'best' };
  if (score >= 6) return { score, scoreLabel: 'चांगला', quality: 'good' };
  if (score >= 4) return { score, scoreLabel: 'मध्यम', quality: 'neutral' };
  return { score, scoreLabel: 'सावधानी', quality: 'caution' };
}

function basisRows(pos) {
  return pos.map((p) => ({
    planet: p.mr, key: p.key, rashi: p.rashiMr, house: p.house, good: p.good,
    retro: p.retro, text: where(p.key, p.rashi, p.house),
  }));
}

function pickUpay(pos, weights) {
  const bad = pos.filter((p) => !p.good && weights[p.key]).sort((a, b) => weights[b.key] - weights[a.key]);
  return bad.length ? UPAY[bad[0].key] : UPAY_DEFAULT;
}

// ── daily ──────────────────────────────────────────────────────────────
function daily(rashi, ymd) {
  const t = at(ymd);
  const pos = g.positions(t, rashi);
  const by = Object.fromEntries(pos.map((p) => [p.key, p]));
  const moon = by.Moon;

  // Moon changing sign before next sunrise
  const moonChange = g.ingresses('Moon', t, at(addDays(ymd, 1)))[0];
  let moonNote = '';
  if (moonChange) {
    const h2 = g.houseFrom(rashi, moonChange.to);
    moonNote = `${istHM(moonChange.at)} नंतर चंद्र ${RASHIS[moonChange.to]} राशीत (${ORDINAL[h2 - 1]} स्थानी) — ${phala('Moon', h2)}`;
  }

  const goodW = pos.filter((p) => p.good).reduce((s, p) => s + DAY_WEIGHT[p.key], 0);
  const totalW = Object.values(DAY_WEIGHT).reduce((a, b) => a + b, 0);
  const sade = g.shaniStatus(rashi, by.Saturn.rashi);

  return {
    date: ymd, dateMR: dateMR(ymd), dayName: dayMR(ymd), rashi: RASHIS[rashi],
    ...grade(goodW, totalW, moon.house === 8),
    chandrashtama: moon.house === 8,
    general: `${where('Moon', moon.rashi, moon.house)}: ${phala('Moon', moon.house)}`,
    moonNote,
    love:   `${where('Venus', by.Venus.rashi, by.Venus.house)}: ${phala('Venus', by.Venus.house)}`,
    career: `${where('Mercury', by.Mercury.rashi, by.Mercury.house)}: ${phala('Mercury', by.Mercury.house)}`,
    health: `${where('Mars', by.Mars.rashi, by.Mars.house)}: ${phala('Mars', by.Mars.house)}`,
    guru:   `${where('Jupiter', by.Jupiter.rashi, by.Jupiter.house)}: ${phala('Jupiter', by.Jupiter.house)}`,
    shani:  `${where('Saturn', by.Saturn.rashi, by.Saturn.house)}: ${phala('Saturn', by.Saturn.house)}`,
    sunEffect: `${where('Sun', by.Sun.rashi, by.Sun.house)}: ${phala('Sun', by.Sun.house)}`,
    sadesati: sade,
    tip: pickUpay(pos, DAY_WEIGHT),
    basis: basisRows(pos),
  };
}

// changes of the non-Moon planets in [from, to)
function planetEvents(rashi, from, to, keys) {
  const ev = [];
  for (const k of keys) {
    for (const x of g.ingresses(k, from, to)) {
      const h = g.houseFrom(rashi, x.to);
      ev.push({ t: x.at.getTime(), date: istYMD(x.at), dateMR: dateMR(istYMD(x.at)), time: istHM(x.at), planet: P[k].mr, key: k,
        kind: k === 'Sun' ? 'संक्रांती' : 'राशीबदल', to: RASHIS[x.to], house: h, good: g.isGood(k, h),
        text: `${P[k].mr} ${RASHIS[x.to]} राशीत (${ORDINAL[h - 1]} स्थानी): ${phala(k, h)}` });
    }
    if (!['Sun', 'Moon', 'Rahu', 'Ketu'].includes(k)) {
      for (const s of g.stations(k, from, to)) {
        ev.push({ t: s.at.getTime(), date: istYMD(s.at), dateMR: dateMR(istYMD(s.at)), time: istHM(s.at), planet: P[k].mr, key: k,
          kind: s.kind, to: RASHIS[s.rashi], text: `${P[k].mr} ${RASHIS[s.rashi]} राशीत ${s.kind} — ${s.kind === 'वक्री' ? 'या ग्रहाच्या कामांत विलंब व पुनर्विचार' : 'रखडलेली कामे पुन्हा गती घेतील'}.` });
      }
    }
  }
  return ev.sort((a, b) => a.t - b.t).map(({ t, ...e }) => e);
}

// ── weekly (7 days from ymd) ───────────────────────────────────────────
function weekly(rashi, ymd) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = daily(rashi, addDays(ymd, i));
    const [, m, dd] = d.date.split('-').map(Number);
    return { date: d.date, dayName: d.dayName, dateNum: dd, monthName: MONTHS_MR[m - 1], isToday: i === 0,
      score: d.score, scoreLabel: d.scoreLabel, quality: d.quality, chandrashtama: d.chandrashtama,
      general: d.general, moonNote: d.moonNote, tip: d.tip };
  });
  const events = planetEvents(rashi, at(ymd, '00:00'), at(addDays(ymd, 7), '00:00'),
    ['Sun', 'Mars', 'Mercury', 'Venus', 'Jupiter', 'Saturn', 'Rahu', 'Ketu']);
  const best = [...days].sort((a, b) => b.score - a.score).slice(0, 2).map((d) => `${d.dayName} (${d.dateNum} ${d.monthName})`);
  const careful = days.filter((d) => d.chandrashtama).map((d) => `${d.dayName} (${d.dateNum} ${d.monthName})`);
  return { from: ymd, to: addDays(ymd, 6), rashi: RASHIS[rashi], days, events, bestDays: best, chandrashtamaDays: careful };
}

// planet stays (periods) inside [from, to)
function stays(key, rashi, from, to) {
  const out = [];
  let start = from, r = g.rashiIdx(key, from);
  for (const x of g.ingresses(key, from, to)) {
    out.push({ start, end: x.at, r });
    start = x.at; r = x.to;
  }
  out.push({ start, end: to, r });
  return out.map((s) => {
    const h = g.houseFrom(rashi, s.r);
    return { from: istYMD(s.start), to: istYMD(new Date(s.end.getTime() - 60000)), rashi: RASHIS[s.r], house: h,
      good: g.isGood(key, h), text: `${where(key, s.r, h)}: ${phala(key, h)}` };
  });
}

// ── monthly (calendar month of ymd) ────────────────────────────────────
function monthly(rashi, ymd) {
  const [y, m] = ymd.split('-').map(Number);
  const first = `${y}-${String(m).padStart(2, '0')}-01`;
  const nextFirst = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const from = at(first, '00:00'), to = at(nextFirst, '00:00');
  const mid = at(`${y}-${String(m).padStart(2, '0')}-15`, '12:00');

  const keys = ['Sun', 'Mars', 'Mercury', 'Venus', 'Jupiter', 'Saturn', 'Rahu', 'Ketu'];
  const planets = keys.map((k) => ({ planet: P[k].mr, key: k, stays: stays(k, rashi, from, to) }));
  const pos = g.positions(mid, rashi).filter((p) => keys.includes(p.key));
  const goodW = pos.filter((p) => p.good).reduce((s, p) => s + MONTH_WEIGHT[p.key], 0);
  const totalW = Object.values(MONTH_WEIGHT).reduce((a, b) => a + b, 0);
  const gr = grade(goodW, totalW);

  // Moon in favourable / 8th house through the month (at 06:00 each day)
  const goodDays = [], chandrashtamaDays = [];
  for (let d = first; d < nextFirst; d = addDays(d, 1)) {
    const h = g.houseFrom(rashi, g.rashiIdx('Moon', at(d)));
    const dd = Number(d.slice(8));
    if (h === 8) chandrashtamaDays.push(dd);
    else if (g.isGood('Moon', h)) goodDays.push(dd);
  }

  const goodCount = pos.filter((p) => p.good).length;
  const overview = `${MONTHS_MR[m - 1]} ${y} मध्ये ${RASHIS[rashi]} राशीसाठी ८ पैकी ${goodCount} ग्रह अनुकूल स्थानी आहेत — महिना एकूण ${gr.scoreLabel === 'सावधानी' ? 'कष्टाचा, सावधगिरीचा' : gr.scoreLabel}.`;
  const sade = g.shaniStatus(rashi, pos.find((p) => p.key === 'Saturn').rashi);

  return {
    month: `${MONTHS_MR[m - 1]} ${y}`, rashi: RASHIS[rashi], ...gr, overview, sadesati: sade,
    planets, events: planetEvents(rashi, from, to, keys),
    goodDays, chandrashtamaDays, remedy: pickUpay(pos, MONTH_WEIGHT), basis: basisRows(pos),
  };
}

// ── yearly (calendar year) ─────────────────────────────────────────────
function yearly(rashi, year) {
  const from = at(`${year}-01-01`, '00:00'), to = at(`${year + 1}-01-01`, '00:00');
  const keys = ['Jupiter', 'Saturn', 'Rahu', 'Ketu'];
  const planets = keys.map((k) => ({ planet: P[k].mr, key: k, stays: stays(k, rashi, from, to) }));

  // weighted share of the year each planet spends in good houses
  let goodW = 0, totalW = 0;
  for (const p of planets) {
    for (const s of p.stays) {
      const days = (Date.parse(s.to) - Date.parse(s.from)) / 86400000 + 1;
      totalW += YEAR_WEIGHT[p.key] * days;
      if (s.good) goodW += YEAR_WEIGHT[p.key] * days;
    }
  }
  const gr = grade(goodW, totalW);

  // sade sati / adichki during the year
  const shaniNotes = planets[1].stays.map((s) => ({ ...s, status: g.shaniStatus(rashi, RASHIS.indexOf(s.rashi)) })).filter((s) => s.status);
  const guruGood = planets[0].stays.filter((s) => s.good);
  const overview = [
    guruGood.length
      ? `गुरू ${guruGood.map((s) => `${dateMR(s.from)} ते ${dateMR(s.to)}`).join(' व ')} या काळात अनुकूल (${guruGood.map((s) => `${ORDINAL[s.house - 1]} स्थानी`).join(', ')}) — या काळात शुभ कार्ये, गुंतवणूक व महत्त्वाचे निर्णय घेणे लाभदायक.`
      : `गुरू वर्षभर प्रतिकूल स्थानी — मोठे निर्णय विचारपूर्वक घ्या.`,
    shaniNotes.length
      ? `शनी: ${shaniNotes.map((s) => `${s.status} (${dateMR(s.from)} ते ${dateMR(s.to)})`).join('; ')}.`
      : `या वर्षी साडेसाती किंवा अडीचकी नाही.`,
  ].join(' ');

  return {
    year, rashi: RASHIS[rashi], ...gr, overview, planets,
    events: planetEvents(rashi, from, to, keys), remedy: pickUpay(g.positions(at(`${year}-07-01`), rashi), YEAR_WEIGHT),
  };
}

// ── cached entry point ─────────────────────────────────────────────────
const cache = new Map();
function get(period, rashi, opts = {}) {
  const today = todayIST();
  const key = `${period}|${rashi}|${opts.date || ''}|${opts.year || ''}|${today}`;
  if (cache.has(key)) return cache.get(key);
  if (cache.size > 2000) cache.clear();
  let out;
  switch (period) {
    case 'today':    out = daily(rashi, opts.date || today); break;
    case 'tomorrow': out = daily(rashi, addDays(opts.date || today, 1)); break;
    case 'week':     out = weekly(rashi, opts.date || today); break;
    case 'month':    out = monthly(rashi, opts.date || today); break;
    case 'year':     out = yearly(rashi, opts.year || Number(today.slice(0, 4))); break;
    default: throw new Error('unknown period');
  }
  cache.set(key, out);
  return out;
}

module.exports = { get, daily, weekly, monthly, yearly, PHALA };
