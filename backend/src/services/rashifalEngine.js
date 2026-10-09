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
    'मन प्रसन्न राहील आणि आरोग्य चांगले राहील. आवडते भोजन व कौटुंबिक सुख मिळेल.',
    'खर्च वाढू शकतो आणि कामांत अडथळे येऊ शकतात. बोलताना संयम ठेवा.',
    'उत्साह व धैर्य वाढेल, कामांत यश मिळेल. भावंडांची साथ लाभेल.',
    'मनात अस्वस्थता किंवा चिंता राहू शकते. घरगुती बाबींत धीर धरा.',
    'निर्णय घेताना गोंधळ होऊ शकतो आणि मुलांबद्दल काळजी वाटेल. महत्त्वाचे निर्णय पुढे ढकला.',
    'आरोग्य व आर्थिक बाजू चांगली राहील. विरोधकांवर मात कराल.',
    'जोडीदाराकडून सौख्य मिळेल, भेटीगाठी होतील आणि लाभ होईल.',
    'चंद्राष्टम असल्याने मन अस्थिर राहील व थकवा जाणवेल. महत्त्वाची कामे, मोठे व्यवहार आणि वाद टाळा.',
    'कामांत विलंब होईल आणि थकवा जाणवेल. श्रद्धा व संयम ठेवा.',
    'कामांत यश व मान-सन्मान मिळेल. हाती घेतलेली कामे पूर्ण होतील.',
    'लाभ होईल, मन आनंदी राहील आणि मित्रांचे सहकार्य मिळेल.',
    'खर्च वाढतील आणि झोप अपुरी राहू शकते. पैशांचे व्यवहार जपून करा.',
  ],
  Sun: [
    'थकवा, चिडचिड आणि दगदग जाणवेल. आरोग्याकडे लक्ष द्या.',
    'आर्थिक नुकसान संभवते आणि डोळ्यांचा त्रास होऊ शकतो. बोलण्यात कटुता टाळा.',
    'नवे पद किंवा जबाबदारी मिळेल, आरोग्य उत्तम राहील आणि विरोधकांवर विजय मिळेल.',
    'घरात मतभेद आणि मानसिक ताण संभवतो. प्रकृतीकडे लक्ष द्या.',
    'मन अशांत राहील आणि मुलांबद्दल काळजी वाटेल. अधिकाऱ्यांशी वाद टाळा.',
    'आजारांपासून आराम मिळेल, विरोधकांवर मात कराल आणि कामांत यश मिळेल.',
    'प्रवासाची दगदग होईल आणि जोडीदाराशी मतभेद संभवतात. पोटाची काळजी घ्या.',
    'आरोग्याच्या तक्रारी आणि सरकारी कामांत अडचणी येऊ शकतात. धोका पत्करू नका.',
    'कामांत अडथळे येतील आणि वडीलधाऱ्यांशी मतभेद संभवतात. धीर धरा.',
    'कामांत यश मिळेल, मान-सन्मान वाढेल आणि प्रगती होईल.',
    'आर्थिक लाभ होईल, मान-सन्मान मिळेल आणि आरोग्य चांगले राहील.',
    'खर्च वाढतील आणि मित्रांशी गैरसमज होऊ शकतात. प्रवासात काळजी घ्या.',
  ],
  Mars: [
    'राग व उतावळेपणा वाढू शकतो. रक्तदाब आणि इजा यांपासून जपा.',
    'पैशांचा अपव्यय आणि कुटुंबात वाद संभवतात. शब्द जपून वापरा.',
    'धैर्य व उत्साह वाढेल, कामांत यश मिळेल. जमीन-जुमल्याच्या कामांत लाभ होईल.',
    'घरात तणाव आणि मालमत्तेचे प्रश्न उद्भवू शकतात. पोटाच्या तक्रारी संभवतात.',
    'मुलांबद्दल काळजी वाटेल. उतावळेपणाने निर्णय घेऊ नका.',
    'विरोधकांवर विजय मिळेल, आरोग्य सुधारेल आणि कामांत यश मिळेल.',
    'जोडीदाराशी वाद संभवतात. भागीदारीच्या व्यवहारांत सावध राहा.',
    'अपघात व इजा यांपासून जपा. वाहन सावकाश चालवा.',
    'थकवा जाणवेल आणि अपमानाचा प्रसंग येऊ शकतो. खर्चावर नियंत्रण ठेवा.',
    'कामाच्या ठिकाणी ताण व स्पर्धा वाढेल. वरिष्ठांशी वाद टाळा.',
    'आर्थिक लाभ होईल, जमीन-मालमत्तेच्या कामांत यश मिळेल आणि आरोग्य चांगले राहील.',
    'अनावश्यक खर्च होईल आणि डोळे व झोप यांच्या तक्रारी संभवतात. वाद टाळा.',
  ],
  Mercury: [
    'चुकीच्या संगतीमुळे नुकसान होऊ शकते. व्यवहार काळजीपूर्वक करा.',
    'धनलाभ होईल आणि बोलण्यातून कामे साधतील. शिक्षणात प्रगती होईल.',
    'विरोधकांकडून त्रास आणि मित्रांशी गैरसमज संभवतात. कागदपत्रे नीट तपासा.',
    'कुटुंबात सौख्य राहील, आर्थिक लाभ होईल आणि नवे संपर्क जुळतील.',
    'जोडीदार व मुलांशी मतभेद संभवतात. विचारपूर्वक बोला.',
    'व्यवसायात यश मिळेल, प्रतिष्ठा वाढेल आणि स्पर्धेत पुढे राहाल.',
    'भागीदारीत वाद संभवतात. करार काळजीपूर्वक करा.',
    'अनपेक्षित लाभ होईल आणि बुद्धीच्या जोरावर कामांत यश मिळेल.',
    'कामांत अडथळे आणि प्रवासात विलंब संभवतो. संयम ठेवा.',
    'व्यवसाय-नोकरीत यश, सौख्य आणि मान मिळेल.',
    'लाभ होईल, नवे संबंध जुळतील आणि आनंदाची बातमी मिळेल.',
    'खर्च व नुकसान संभवते. कागदोपत्री व्यवहारांत सावध राहा.',
  ],
  Venus: [
    'सुख-सोयी लाभतील, मन आनंदी राहील आणि प्रेमात गोडवा येईल.',
    'धनलाभ होईल, कुटुंबात आनंद राहील आणि संवादात गोडवा येईल.',
    'मान-सन्मान मिळेल, प्रगती होईल आणि नव्या ओळखी होतील.',
    'मित्र-परिवारासोबत आनंदाचे क्षण येतील आणि घरात सुख राहील.',
    'मुलांकडून आनंद मिळेल, प्रेमसंबंधांत गोडवा येईल आणि लाभ होईल.',
    'नात्यांत गैरसमज आणि विरोधकांकडून त्रास संभवतो. संयम ठेवा.',
    'जोडीदाराशी मतभेद किंवा नात्यात ताण येऊ शकतो. समजूतदारपणा ठेवा.',
    'अनपेक्षित धनलाभ होईल आणि सुख-सोयी वाढतील.',
    'धार्मिक कार्यांत सहभाग होईल, भाग्याची साथ मिळेल आणि मन आनंदी राहील.',
    'कामाच्या ठिकाणी वाद आणि मानहानीचा संभव आहे. व्यवहार जपून करा.',
    'आर्थिक लाभ होईल आणि मित्रांकडून आनंद मिळेल.',
    'सुख-सोयींवर खर्च होईल, पण लाभही होईल. काळ आरामदायी राहील.',
  ],
  Jupiter: [
    'स्थानबदल, खर्च आणि मनात अस्वस्थता संभवते. निर्णय विचारपूर्वक घ्या.',
    'धनलाभ होईल, कुटुंबात सौख्य राहील आणि आपल्या शब्दाला मान मिळेल.',
    'कामांत अडथळे येतील आणि स्थानबदलही संभवतो. प्रयत्न वाढवावे लागतील.',
    'कौटुंबिक चिंता राहील आणि घर-वाहनाच्या प्रश्नांत अडचणी येऊ शकतात.',
    'संततिसुख मिळेल, बुद्धी व शिक्षणात प्रगती होईल आणि शुभ कार्ये घडतील.',
    'विरोधकांचा त्रास आणि आरोग्याच्या तक्रारी संभवतात. कर्ज घेणे टाळा.',
    'विवाहाचे योग येतील, जोडीदाराकडून सौख्य मिळेल आणि भागीदारीत लाभ होईल.',
    'हा अडचणींचा काळ आहे. आरोग्य व आर्थिक बाबतीत सावधगिरी बाळगा.',
    'भाग्योदय होईल, धार्मिक कार्ये घडतील आणि वडीलधाऱ्यांचा आशीर्वाद मिळेल.',
    'कामात बदल किंवा ताण संभवतो आणि प्रतिष्ठेबद्दल काळजी वाटेल. धीर धरा.',
    'लाभ होईल, मान-सन्मान मिळेल आणि इच्छा पूर्ण होतील.',
    'खर्च, प्रवास आणि दगदग वाढेल. धार्मिक कार्यांवर खर्च होईल.',
  ],
  Saturn: [
    'साडेसातीचा मधला टप्पा असल्याने दगदग, आरोग्याच्या तक्रारी आणि कामांत विलंब संभवतो. शिस्त व संयम ठेवा.',
    'साडेसातीचा शेवटचा टप्पा असल्याने आर्थिक ताण व कौटुंबिक मतभेद संभवतात. बचतीवर भर द्या.',
    'कष्टाचे फळ मिळेल, आर्थिक लाभ होईल आणि आरोग्य चांगले राहील.',
    'अडीचकीमुळे घरगुती अडचणी, मालमत्तेचे प्रश्न आणि मानसिक ताण संभवतो.',
    'मुलांबद्दल चिंता आणि निर्णयात गोंधळ संभवतो. गुंतवणूक जपून करा.',
    'विरोधकांवर विजय मिळेल, आरोग्य सुधारेल आणि कष्टातून लाभ होईल.',
    'प्रवासाची दगदग होईल आणि जोडीदाराशी मतभेद संभवतात. नाती जपा.',
    'अष्टम शनीमुळे (अडीचकी) अडथळे आणि आरोग्याच्या तक्रारी संभवतात. धोका पत्करू नका.',
    'भाग्यात विलंब आणि धार्मिक कार्यांत अडथळे येऊ शकतात. प्रयत्न सोडू नका.',
    'कामाचा भार वाढेल आणि प्रतिष्ठेबद्दल काळजी वाटेल. प्रामाणिकपणे कष्ट करा.',
    'उत्पन्न वाढेल, कष्टाचे फळ मिळेल आणि रखडलेली कामे मार्गी लागतील.',
    'साडेसातीचा पहिला टप्पा असल्याने खर्च वाढतील. झोप व मनःशांतीकडे लक्ष द्या.',
  ],
  Rahu: [
    'मनात गोंधळ व अस्वस्थता राहील. घाईने निर्णय घेऊ नका.',
    'आर्थिक चढ-उतार आणि कुटुंबात गैरसमज संभवतात. बोलताना सावध राहा.',
    'धाडस वाढेल, यश मिळेल आणि अनपेक्षित लाभ होईल.',
    'घरात अशांतता आणि मानसिक ताण संभवतो.',
    'मुलांबद्दल काळजी वाटेल. सट्टा-जुगारापासून दूर राहा.',
    'विरोधकांवर मात कराल, आरोग्य सुधारेल आणि स्पर्धेत यश मिळेल.',
    'नात्यांत गैरसमज संभवतात. भागीदारीत सावधगिरी बाळगा.',
    'अचानक अडचणी येऊ शकतात. आरोग्याकडे लक्ष द्या.',
    'भाग्यात अडथळे आणि वडीलधाऱ्यांशी मतभेद संभवतात.',
    'कामात अस्थिरता जाणवेल आणि बदलाचे विचार येतील. विचारपूर्वक पावले उचला.',
    'अनपेक्षित लाभ होईल आणि इच्छा पूर्ण होतील.',
    'अनावश्यक खर्च आणि झोपेच्या तक्रारी संभवतात. दूरच्या प्रवासाचे योग आहेत.',
  ],
  Ketu: [
    'आरोग्य व मनःस्थितीकडे लक्ष द्या. अध्यात्माकडे ओढा राहील.',
    'कौटुंबिक मतभेद आणि खर्च संभवतो. बोलण्यात संयम ठेवा.',
    'धैर्य वाढेल, यश मिळेल आणि अडचणींवर मात कराल.',
    'घरात अस्वस्थता राहील. आईच्या आरोग्याची काळजी घ्या.',
    'मुलांबद्दल काळजी आणि निर्णयात गोंधळ संभवतो.',
    'विरोधकांवर मात कराल आणि आरोग्य सुधारेल.',
    'जोडीदाराशी दुरावा किंवा गैरसमज संभवतो. संवाद कायम ठेवा.',
    'अचानक अडचणी येऊ शकतात. इजेपासून जपा.',
    'भाग्यात विलंब होईल आणि धार्मिक कार्यांकडे ओढा राहील.',
    'कामांत अडथळे येतील आणि मन अस्थिर राहील.',
    'लाभ होईल आणि इच्छा पूर्ण होतील.',
    'खर्च वाढेल. अध्यात्म व तीर्थयात्रेचे योग आहेत.',
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
// what a planet's retrograde / direct station affects
const DOMAIN = { Mars: 'जमीन-जुमला व धाडसाची कामे', Mercury: 'व्यवहार, संवाद व कागदपत्रे', Jupiter: 'शिक्षण, संतती व आर्थिक निर्णय', Venus: 'प्रेमसंबंध व सुख-सोयी', Saturn: 'नोकरी-व्यवसायातील कामे' };

function phala(key, house) { return PHALA[key][house - 1]; }
// "गुरू पाचव्या स्थानी (सिंह राशीत)" — for the basis list and headings
function where(key, rashi, house) {
  return house === 1 ? `${P[key].mr} आपल्याच राशीत (${RASHIS[rashi]})` : `${P[key].mr} ${ORDINAL[house - 1]} स्थानी (${RASHIS[rashi]} राशीत)`;
}
// full sentence: "गुरू पाचव्या स्थानी (सिंह राशीत) आहे. संततिसुख मिळेल…"
function sentence(key, rashi, house) {
  return `${where(key, rashi, house)} आहे. ${phala(key, house)}`;
}
// for a planet's own card (name already shown): "पाचव्या स्थानी (सिंह राशीत) — …"
function stayText(key, rashi, house) {
  const pos = house === 1 ? `आपल्याच राशीत (${RASHIS[rashi]})` : `${ORDINAL[house - 1]} स्थानी (${RASHIS[rashi]} राशीत)`;
  return `${pos} — ${phala(key, house)}`;
}

// ── time helpers (IST) ─────────────────────────────────────────────────
const at = (ymd, hm = '06:00') => new Date(`${ymd}T${hm}:00+05:30`);
const istYMD = (d) => new Date(d.getTime() + IST).toISOString().slice(0, 10);
const istHM = (d) => {
  const x = new Date(d.getTime() + IST);
  const h = x.getUTCHours(), m = x.getUTCMinutes();
  const part = h < 4 ? 'रात्री' : h < 6 ? 'पहाटे' : h < 12 ? 'सकाळी' : h < 16 ? 'दुपारी' : h < 20 ? 'सायंकाळी' : 'रात्री';
  return `${part} ${h % 12 || 12}:${String(m).padStart(2, '0')}`;
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
    moonNote = `${istHM(moonChange.at)} नंतर चंद्र ${RASHIS[moonChange.to]} राशीत, म्हणजे ${ORDINAL[h2 - 1]} स्थानी जाईल. त्यानंतर: ${phala('Moon', h2)}`;
  }

  const goodW = pos.filter((p) => p.good).reduce((s, p) => s + DAY_WEIGHT[p.key], 0);
  const totalW = Object.values(DAY_WEIGHT).reduce((a, b) => a + b, 0);
  const sade = g.shaniStatus(rashi, by.Saturn.rashi);

  return {
    date: ymd, dateMR: dateMR(ymd), dayName: dayMR(ymd), rashi: RASHIS[rashi],
    ...grade(goodW, totalW, moon.house === 8),
    chandrashtama: moon.house === 8,
    general: sentence('Moon', moon.rashi, moon.house),
    moonNote,
    love:   sentence('Venus', by.Venus.rashi, by.Venus.house),
    career: sentence('Mercury', by.Mercury.rashi, by.Mercury.house),
    health: sentence('Mars', by.Mars.rashi, by.Mars.house),
    guru:   sentence('Jupiter', by.Jupiter.rashi, by.Jupiter.house),
    shani:  sentence('Saturn', by.Saturn.rashi, by.Saturn.house),
    sunEffect: sentence('Sun', by.Sun.rashi, by.Sun.house),
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
        text: `${P[k].mr} ${RASHIS[x.to]} राशीत${k === 'Sun' ? ` (${RASHIS[x.to]} संक्रांती)` : ''}, म्हणजे आपल्या ${ORDINAL[h - 1]} स्थानी प्रवेश करेल. ${phala(k, h)}` });
    }
    if (!['Sun', 'Moon', 'Rahu', 'Ketu'].includes(k)) {
      for (const s of g.stations(k, from, to)) {
        ev.push({ t: s.at.getTime(), date: istYMD(s.at), dateMR: dateMR(istYMD(s.at)), time: istHM(s.at), planet: P[k].mr, key: k,
          kind: s.kind, to: RASHIS[s.rashi], text: s.kind === 'वक्री'
            ? `${P[k].mr} ${RASHIS[s.rashi]} राशीत वक्री होईल. ${DOMAIN[k]} यांत विलंब होऊ शकतो; निर्णयांचा पुनर्विचार करा.`
            : `${P[k].mr} ${RASHIS[s.rashi]} राशीत मार्गी होईल. ${DOMAIN[k]} यांतील रखडलेली कामे पुन्हा गती घेतील.` });
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
      good: g.isGood(key, h), text: stayText(key, s.r, h) };
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
  const verdict = { best: 'उत्तम जाईल', good: 'चांगला जाईल', neutral: 'संमिश्र फळ देणारा राहील', caution: 'कष्टाचा राहील; सावधगिरी बाळगा' }[gr.quality];
  const overview = `${MONTHS_MR[m - 1]} ${y} मध्ये ${RASHIS[rashi]} राशीसाठी 8 पैकी ${goodCount} ग्रह अनुकूल स्थानी आहेत. एकूण पाहता हा महिना ${verdict}.`;
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
      ? `${guruGood.map((s) => `${dateMR(s.from)} ते ${dateMR(s.to)}`).join(' आणि ')} या काळात गुरू ${guruGood.map((s) => `${ORDINAL[s.house - 1]} स्थानी`).join(' व ')} असल्याने अनुकूल राहील. या काळात शुभ कार्ये, गुंतवणूक व महत्त्वाचे निर्णय घेणे लाभदायक ठरेल.`
      : `या वर्षी गुरू अनुकूल स्थानी येत नाही, म्हणून मोठे निर्णय विचारपूर्वक घ्या.`,
    shaniNotes.length
      ? [...new Set(shaniNotes.map((s) => s.status))].map((st) =>
          `${shaniNotes.filter((s) => s.status === st).map((s) => `${dateMR(s.from)} ते ${dateMR(s.to)}`).join(' आणि ')} या काळात ${st} चालू राहील.`).join(' ')
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
