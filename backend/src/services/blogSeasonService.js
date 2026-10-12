'use strict';
// blogSeasonService.js — decides which blogs are "in season" so the blog list can show
// them first (e.g. shraddha blogs during Pitrupaksha, Ganesh blogs during Ganeshotsav).
// Dates come from the in-house panchang engine (amanta maas + continuous tithi 1-30),
// so this works for any year without maintaining a festival calendar by hand.
const { getPanchang } = require('./panchangService');
const { getCache, setCache } = require('../utils/redis');

// Pune — reference point for Maharashtra-wide festival dates
const LAT = 18.5204, LON = 73.8567, TZ = 330;   // TZ in minutes, as getPanchang expects
const LEAD_DAYS = 15;          // start boosting a festival this many days before it

// tithi: continuous 1-30 (शुक्ल प्रतिपदा=1 … पौर्णिमा=15, कृष्ण प्रतिपदा=16 … अमावस्या=30).
// By default the tithi is the one at sunrise. Festivals the shastra fixes by another time of
// day carry `at` (local HH:MM, Pune): दसरा = दशमी at अपराह्ण, कोजागरी / शिवरात्र / गोकुळाष्टमी
// = तिथी at निशीथ (midnight), रामनवमी / गणेश चतुर्थी = मध्याह्न.
const AT = { madhyahna: '12:30', aparahna: '14:40', nishita: '23:55' };
// `when` lists [maas, fromTithi, toTithi] spans; `greg` is a fixed solar-calendar span.
// `kw` is a MySQL (ICU) regex matched against title + slug + tags; `not` excludes posts
// that match it (e.g. चैत्र नवरात्र posts must not rank as शारदीय नवरात्र).
const PITRU_KW = 'पितृ|पितर|श्राद्ध|महालय|तर्पण|पिंडदान|सर्वपित|अविधवा|दौहित्र|गजच्छाया|घात चतुर्दशी|सपिंडी|pitru|shraddh|mahalaya';
const SEASONS = [
  { key: 'makar-sankranti', name: 'मकर संक्रांती', icon: '🪁', greg: [1, 10, 1, 15], kw: 'संक्रांत|तिळगूळ|sankrant' },
  { key: 'gudi-padwa', name: 'गुढी पाडवा', icon: '🚩', when: [['चैत्र', 1, 1]], kw: 'गुढी|gudi' },
  { key: 'chaitra-navratri', name: 'चैत्र नवरात्र', icon: '🔱', when: [['चैत्र', 1, 9]], kw: 'चैत्र नवरात्र|chaitra' },
  { key: 'ramnavami', name: 'रामनवमी', icon: '🏹', at: AT.madhyahna, when: [['चैत्र', 9, 9]], kw: 'राम ?नवमी|रामजन्म|ram-?navami' },
  { key: 'hanuman-jayanti', name: 'हनुमान जयंती', icon: '🚩', when: [['चैत्र', 15, 15]], kw: 'हनुमान|मारुती|hanuman' },
  { key: 'akshaya-tritiya', name: 'अक्षय तृतीया', icon: '🪙', when: [['वैशाख', 3, 3]], kw: 'अक्षय तृतीया|akshay' },
  { key: 'vat-pournima', name: 'वटपौर्णिमा', icon: '🌳', when: [['ज्येष्ठ', 13, 15]], kw: 'वट ?पौर्णिमा|वटसावित्री|vat-?p' },
  { key: 'ashadhi', name: 'आषाढी एकादशी', icon: '🙏', when: [['आषाढ', 11, 11]], kw: 'आषाढी|वारी|विठ्ठल|पांडुरंग|पंढरपूर|ashadhi|vitthal|pandharpur' },
  { key: 'guru-pournima', name: 'गुरुपौर्णिमा', icon: '📿', when: [['आषाढ', 15, 15]], kw: 'गुरु ?पौर्णिमा|गुरू पौर्णिमा|guru-?p' },
  { key: 'nagpanchami', name: 'नागपंचमी', icon: '🐍', when: [['श्रावण', 5, 5]], kw: 'नागपंचमी|nag-?panchami' },
  { key: 'rakshabandhan', name: 'रक्षाबंधन', icon: '🪢', when: [['श्रावण', 15, 15]], kw: 'रक्षाबंधन|राखी|नारळी पौर्णिमा|raksha' },
  { key: 'janmashtami', name: 'गोकुळाष्टमी', icon: '🦚', at: AT.nishita, when: [['श्रावण', 23, 24]], kw: 'गोकुळाष्टमी|जन्माष्टमी|दहीहंडी|श्रीकृष्ण|janmashtami|gokul' },
  { key: 'pola', name: 'पोळा', icon: '🐂', when: [['श्रावण', 30, 30]], kw: 'पोळा|pola' },
  { key: 'shravan', name: 'श्रावण मास', icon: '🕉️', when: [['श्रावण', 1, 30]], kw: 'श्रावण|shravan' },
  { key: 'haritalika', name: 'हरितालिका', icon: '🌸', when: [['भाद्रपद', 3, 3]], kw: 'हरितालिका|haritalika' },
  { key: 'rishipanchami', name: 'ऋषिपंचमी', icon: '🙏', when: [['भाद्रपद', 5, 5]], kw: 'ऋषिपंचमी|rishi-?panchami' },
  { key: 'gauri', name: 'गौरी आगमन', icon: '🌼', when: [['भाद्रपद', 6, 8]], kw: 'गौरी|gauri' },
  { key: 'ganeshotsav', name: 'गणेशोत्सव', icon: '🐘', at: AT.madhyahna, when: [['भाद्रपद', 4, 14]], kw: 'गणेश|गणपती|अनंत चतुर्दशी|ganesh|ganpati' },
  { key: 'pitrupaksha', name: 'पितृपक्ष', icon: '🪔', when: [['भाद्रपद', 15, 30], ['आश्विन', 1, 1]], kw: PITRU_KW },
  { key: 'navratri', name: 'शारदीय नवरात्र', icon: '🔱', when: [['आश्विन', 1, 9]], kw: 'नवरात्र|घटस्थापना|दुर्गा|अंबाबाई|तुळजा|navratri|ghatasthapana|durga', not: 'चैत्र|chaitra' },
  { key: 'dasara', name: 'दसरा', icon: '🏹', at: AT.aparahna, when: [['आश्विन', 10, 10]], kw: 'दसरा|विजयादशमी|सीमोल्लंघन|dasara|dussehra|vijaya' },
  { key: 'kojagiri', name: 'कोजागरी पौर्णिमा', icon: '🌕', at: AT.nishita, when: [['आश्विन', 15, 15]], kw: 'कोजागर|kojagiri' },
  { key: 'diwali', name: 'दिवाळी', icon: '🪔', when: [['आश्विन', 27, 30], ['कार्तिक', 1, 2]], kw: 'दिवाळी|दीपावली|लक्ष्मी ?पूजन|धनत्रयोदशी|नरक चतुर्दशी|वसुबारस|बलिप्रतिपदा|भाऊबीज|diwali|dhanteras|bhaubij|lakshmi-?pujan' },
  { key: 'kartiki', name: 'कार्तिकी एकादशी व तुळशी विवाह', icon: '🌿', when: [['कार्तिक', 11, 15]], kw: 'कार्तिकी|तुळशी विवाह|त्रिपुरारी|देव दिवाळी|tulsi|kartiki' },
  { key: 'champashashthi', name: 'चंपाषष्ठी', icon: '🚩', when: [['मार्गशीर्ष', 1, 6]], kw: 'खंडोबा|चंपाषष्ठी|जेजुरी|khandoba' },
  { key: 'datta-jayanti', name: 'दत्त जयंती', icon: '🪷', when: [['मार्गशीर्ष', 8, 15]], kw: 'दत्तात्रेय|दत्त जयंती|दत्त संप्रदाय|दत्तगुरु|दिगंबरा|datta' },
  { key: 'margashirsha', name: 'मार्गशीर्ष गुरुवार', icon: '🪷', when: [['मार्गशीर्ष', 1, 30]], kw: 'मार्गशीर्ष|margashirsha' },
  { key: 'ganesh-jayanti', name: 'माघी गणेश जयंती', icon: '🐘', when: [['माघ', 4, 4]], kw: 'गणेश जयंती|माघी गणेश' },
  { key: 'rathasaptami', name: 'रथसप्तमी', icon: '☀️', when: [['माघ', 7, 7]], kw: 'रथसप्तमी|ratha' },
  { key: 'mahashivratri', name: 'महाशिवरात्री', icon: '🕉️', at: AT.nishita, when: [['माघ', 29, 29]], kw: 'शिवरात्र|shivratri|ज्योतिर्लिंग|jyotirling' },
  { key: 'holi', name: 'होळी', icon: '🎨', when: [['फाल्गुन', 15, 20]], kw: 'होळी|होलिका|धुलिवंदन|रंगपंचमी|holi' },
];

// Every Hindu month name, so blogs about the current month rank above the rest
const MONTHS = ['चैत्र', 'वैशाख', 'ज्येष्ठ', 'आषाढ', 'श्रावण', 'भाद्रपद', 'आश्विन', 'कार्तिक', 'मार्गशीर्ष', 'पौष', 'माघ', 'फाल्गुन'];

function inSeason(season, maas, tithi, dateStr) {
  if (season.greg) {
    const [m1, d1, m2, d2] = season.greg;
    const [, m, d] = dateStr.split('-').map(Number);
    const v = m * 100 + d;
    return v >= m1 * 100 + d1 && v <= m2 * 100 + d2;
  }
  // Panchang may prefix an adhik month ("अधिक श्रावण"); festivals follow the nija month
  if (/अधिक/.test(maas)) return false;
  return season.when.some(([mm, a, b]) => maas.endsWith(mm) && tithi >= a && tithi <= b);
}

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// Seasons active on dateStr or starting within LEAD_DAYS, with a ranking weight:
// ongoing = 1000, upcoming = 900 - 20 per day away (sooner ranks higher).
async function getSeasonContext(dateStr) {
  const active = new Map();
  let maas = null;
  for (let k = 0; k <= LEAD_DAYS; k++) {
    const day = addDays(dateStr, k);
    const p = await getPanchang(day, LAT, LON, TZ);
    if (k === 0) maas = p.maas;
    const atTime = {}; // panchang at a festival's own time of day, fetched once per time
    for (const s of SEASONS) {
      if (active.has(s.key)) continue;
      let q = p;
      if (s.at) q = atTime[s.at] || (atTime[s.at] = await getPanchang(day, LAT, LON, TZ, s.at));
      if (!inSeason(s, q.maas, q.tithi.num, day)) continue;
      active.set(s.key, { key: s.key, name: s.name, icon: s.icon, kw: s.kw, not: s.not || null, daysAway: k, weight: k === 0 ? 1000 : 900 - k * 20 });
    }
  }
  const seasons = [...active.values()].sort((a, b) => b.weight - a.weight);
  const month = MONTHS.find(m => maas && maas.endsWith(m)) || null;
  return { date: dateStr, maas, month, seasons };
}

async function getTodaySeasonContext() {
  const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const key = `blog:season:${dateStr}`;
  const cached = await getCache(key);
  if (cached) return cached;
  let ctx = { date: dateStr, maas: null, month: null, seasons: [] };
  try { ctx = await getSeasonContext(dateStr); }
  catch (e) { console.error('blogSeason panchang error:', e.message); }
  await setCache(key, ctx, 6 * 60 * 60);
  return ctx;
}

// SQL fragments ranking posts by season relevance. Returns { score, label, params }
// where score/label are SQL expressions over blog_posts to put in SELECT/ORDER BY.
const HAY = "(CONCAT_WS(' ', title, slug, CONVERT(CAST(tags AS CHAR) USING utf8mb4)) COLLATE utf8mb4_unicode_ci)";
function seasonOrderSql(ctx) {
  const rules = ctx.seasons.map(s => ({ kw: s.kw, not: s.not, weight: s.weight, label: `${s.icon} ${s.name}` }));
  if (ctx.month) rules.push({ kw: ctx.month, weight: 100, label: `${ctx.month} मास` });
  if (!rules.length) return { score: '0', label: 'NULL', params: [], labelParams: [] };
  const whens = rules.map(r => (r.not
    ? `WHEN ${HAY} REGEXP ? AND NOT ${HAY} REGEXP ? THEN ?`
    : `WHEN ${HAY} REGEXP ? THEN ?`)).join(' ');
  const match = r => (r.not ? [r.kw, r.not] : [r.kw]);
  return {
    score: `(CASE ${whens} ELSE 0 END)`,
    params: rules.flatMap(r => [...match(r), r.weight]),
    label: `(CASE ${whens} ELSE NULL END)`,
    labelParams: rules.flatMap(r => [...match(r), r.label]),
  };
}

module.exports = { getTodaySeasonContext, getSeasonContext, seasonOrderSql, SEASONS };
