// src/services/panchangService.js — Production-grade Panchang calculation (Amanta / Drik standard)
'use strict';

const SunCalc = require('suncalc');

// ── Cache ────────────────────────────────────────────────────────
const _cache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 min (shorter since time param varies)

function getCached(key) {
  const e = _cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) { _cache.delete(key); return null; }
  return e.data;
}
function setCache(key, data) { _cache.set(key, { data, ts: Date.now() }); }

// ── Julian Day ───────────────────────────────────────────────────
function toJD(date) {
  let Y = date.getUTCFullYear();
  let M = date.getUTCMonth() + 1;
  const D = date.getUTCDate()
    + date.getUTCHours()   / 24
    + date.getUTCMinutes() / 1440
    + date.getUTCSeconds() / 86400;
  if (M <= 2) { Y--; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716))
       + Math.floor(30.6001 * (M + 1))
       + D + B - 1524.5;
}

const norm360 = d => ((d % 360) + 360) % 360;
const toRad   = d => d * Math.PI / 180;

// ── Lahiri Ayanamsha (dynamic — changes ~50.29″/year) ────────────
// Reference value at J2000.0 = 23.85333° (Lahiri 1956 / IAU 1983 standard)
function getLahiriAyanamsha(JD) {
  const yearsFromJ2000 = (JD - 2451545.0) / 365.25;
  return 23.85333 + yearsFromJ2000 * (50.29 / 3600);
}

// ── Lagna (Ascendant) — changes every ~2 hours ───────────────────
// Returns tropical ecliptic longitude of the rising point
function getLagnaTropical(JD, lat, lon) {
  const T    = (JD - 2451545.0) / 36525.0;
  const eps  = 23.439291 - 0.0130042 * T; // obliquity of ecliptic
  const epsR = toRad(eps);
  const latR = toRad(lat);

  // Greenwich Mean Sidereal Time (degrees)
  const GMST = norm360(
    280.46061837
    + 360.98564736629 * (JD - 2451545.0)
    + 0.000387933 * T * T
  );
  // RAMC = Local Sidereal Time
  const RAMC  = norm360(GMST + lon);
  const ramcR = toRad(RAMC);

  // Ascendant formula: atan2(-cos(RAMC), sin(RAMC)*cos(ε) + tan(φ)*sin(ε))
  // Quadrant correction: if denominator x < 0, add 180°
  // Swiss Ephemeris standard: atan2(cos(RAMC), -(sin(RAMC)*cos(ε)+tan(φ)*sin(ε)))
  const asc = Math.atan2(Math.cos(ramcR), -(Math.sin(ramcR) * Math.cos(epsR) + Math.tan(latR) * Math.sin(epsR))) * 180 / Math.PI;
  return norm360(asc);
}

// ── Sun longitude (Meeus Ch.25, accuracy ~0.01°) ─────────────────
function sunLongitude(JD) {
  const T  = (JD - 2451545.0) / 36525.0;
  const L0 = norm360(280.46646  + 36000.76983 * T + 0.0003032 * T * T);
  const M  = norm360(357.52911  + 35999.05029 * T - 0.0001537 * T * T);
  const Mr = toRad(M);
  const C  = (1.914602  - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
           + (0.019993  - 0.000101 * T) * Math.sin(2 * Mr)
           +  0.000289  * Math.sin(3 * Mr);
  const omega = 125.04 - 1934.136 * T;
  return norm360(L0 + C - 0.00569 - 0.00478 * Math.sin(toRad(omega)));
}

// ── Moon longitude (Meeus Ch.47, extended to 30 major terms ≈ 1′ accuracy) ──
function moonLongitude(JD) {
  const T  = (JD - 2451545.0) / 36525.0;
  const T2 = T * T;

  const L1 = norm360(218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T2 * T / 538841);
  const Ms = norm360(357.5291092 +  35999.0502909  * T - 0.0001536 * T2);
  const Mm = norm360(134.9633964 + 477198.8675055  * T + 0.0087414 * T2);
  const Dv = norm360(297.8501921 + 445267.1114034  * T - 0.0018819 * T2);
  const Fv = norm360( 93.2720950 + 483202.0175233  * T - 0.0036539 * T2);

  const mr  = toRad(Ms);
  const m1r = toRad(Mm);
  const dr  = toRad(Dv);
  const fr  = toRad(Fv);

  // E correction for eccentricity
  const E  = 1 - 0.002516 * T - 0.0000074 * T2;
  const E2 = E * E;

  const dL =
    // Major terms (from Meeus Table 47.A, top 30)
      6.288774 * Math.sin(m1r)
    + 1.274027 * Math.sin(2*dr - m1r)
    + 0.658314 * Math.sin(2*dr)
    + 0.213618 * Math.sin(2*m1r)
    - 0.185116 * E * Math.sin(mr)
    - 0.114332 * Math.sin(2*fr)
    + 0.058793 * Math.sin(2*dr - 2*m1r)
    + 0.057066 * E * Math.sin(2*dr - mr - m1r)
    + 0.053322 * Math.sin(2*dr + m1r)
    + 0.045758 * E * Math.sin(2*dr - mr)
    - 0.040923 * E * Math.sin(mr - m1r)
    - 0.034720 * Math.sin(dr)
    - 0.030383 * E * Math.sin(mr + m1r)
    + 0.015327 * Math.sin(2*dr - 2*fr)
    - 0.012528 * Math.sin(m1r + 2*fr)
    + 0.010980 * Math.sin(m1r - 2*fr)
    + 0.010675 * Math.sin(4*dr - m1r)
    + 0.010034 * Math.sin(3*m1r)
    + 0.008548 * Math.sin(4*dr - 2*m1r)
    - 0.007888 * E * Math.sin(2*dr + mr - m1r)
    - 0.006766 * E * Math.sin(2*dr + mr)
    - 0.005163 * Math.sin(m1r - dr)
    + 0.004987 * E * Math.sin(mr + dr)
    + 0.004036 * E * Math.sin(2*dr - mr + m1r)
    + 0.003994 * Math.sin(2*dr + 2*m1r)
    + 0.003861 * Math.sin(4*dr)
    + 0.003665 * Math.sin(2*dr - 3*m1r)
    - 0.002689 * E * Math.sin(mr - 2*m1r)
    - 0.002602 * Math.sin(m1r - 2*dr - 2*fr)
    + 0.002390 * E * Math.sin(2*dr - mr - 2*m1r)
    - 0.002348 * Math.sin(m1r + dr)
    + 0.002236 * E2 * Math.sin(2*dr - 2*mr)
    - 0.002120 * E * Math.sin(mr + 2*m1r)
    - 0.002069 * E2 * Math.sin(2*mr)
    + 0.002048 * E2 * Math.sin(2*dr - 2*mr - m1r)
    - 0.001773 * Math.sin(m1r + 2*dr - 2*fr)
    - 0.001595 * Math.sin(2*dr + 2*fr)
    + 0.001215 * E * Math.sin(4*dr - mr - m1r)
    - 0.001110 * Math.sin(2*m1r + 2*fr)
    - 0.000892 * Math.sin(3*dr - m1r)
    - 0.000810 * E * Math.sin(2*dr + mr + m1r)
    + 0.000759 * E * Math.sin(4*dr - mr - 2*m1r)
    - 0.000713 * E2 * Math.sin(2*mr - m1r)
    - 0.000700 * E * Math.sin(2*dr + 2*mr - m1r)
    + 0.000691 * E * Math.sin(2*dr - 2*mr + m1r)
    + 0.000596 * E * Math.sin(2*dr - mr - 2*fr)
    + 0.000549 * Math.sin(4*dr + m1r)
    + 0.000537 * Math.sin(4*m1r)
    + 0.000520 * E * Math.sin(4*dr - mr)
    - 0.000487 * Math.sin(m1r - 2*dr)
    - 0.000399 * E * Math.sin(2*dr + mr - 2*fr)
    - 0.000381 * Math.sin(2*m1r - 2*fr)
    + 0.000351 * E * Math.sin(dr + mr + m1r)
    - 0.000340 * Math.sin(3*dr - 2*m1r)
    + 0.000330 * Math.sin(4*dr - 3*m1r)
    + 0.000327 * E * Math.sin(2*dr - mr + 2*m1r)
    - 0.000323 * E2 * Math.sin(2*mr + m1r)
    + 0.000299 * E * Math.sin(dr + mr - m1r)
    + 0.000294 * Math.sin(2*dr + 3*m1r);

  return norm360(L1 + dL);
}

// ── Lookup tables (Marathi) ──────────────────────────────────────

const TITHIS = [
  'प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पंचमी',
  'षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी',
  'एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी','पौर्णिमा',
  'प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पंचमी',
  'षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी',
  'एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी','अमावस्या',
];

const NAKSHATRAS = [
  'अश्विनी','भरणी','कृत्तिका','रोहिणी','मृगशिरा',
  'आर्द्रा','पुनर्वसु','पुष्य','अश्लेषा','मघा',
  'पूर्वा फाल्गुनी','उत्तरा फाल्गुनी','हस्त','चित्रा','स्वाती',
  'विशाखा','अनुराधा','ज्येष्ठा','मूळ','पूर्वाषाढा',
  'उत्तराषाढा','श्रवण','धनिष्ठा','शतभिषा','पूर्वाभाद्रपदा',
  'उत्तराभाद्रपदा','रेवती',
];

const YOGAS = [
  'विष्कुंभ','प्रीती','आयुष्मान','सौभाग्य','शोभन',
  'अतिगंड','सुकर्मा','धृती','शूल','गंड',
  'वृद्धी','ध्रुव','व्याघात','हर्षण','वज्र',
  'सिद्धी','व्यातीपात','वरीयान','परिघ','शिव',
  'सिद्ध','साध्य','शुभ','शुक्ल','ब्रह्म',
  'इंद्र','वैधृती',
];

const KARANAS = [
  'बव','बालव','कौलव','तैतिल','गर',
  'वणिज','विष्टि','शकुनि','चतुष्पाद','नाग','किंस्तुघ्न',
];

const RASHIS = [
  'मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या',
  'तुला','वृश्चिक','धनु','मकर','कुंभ','मीन',
];

const MAAS = [
  'चैत्र','वैशाख','ज्येष्ठ','आषाढ','श्रावण','भाद्रपद',
  'आश्विन','कार्तिक','मार्गशीर्ष','पौष','माघ','फाल्गुन',
];

const PAKSHA        = ['शुक्ल पक्ष', 'कृष्ण पक्ष'];
const VAR           = ['रविवार','सोमवार','मंगळवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];
const RAHU_SEG      = [7, 1, 6, 4, 5, 2, 3];
const GULIKA_SEG    = [6, 5, 4, 3, 2, 1, 0];
const YAMAGANDA_SEG = [3, 2, 1, 0, 5, 4, 6];

// ── Time helpers ─────────────────────────────────────────────────

function fmtTime(date, tzOffsetMins) {
  const local = new Date(date.getTime() + tzOffsetMins * 60000);
  return `${String(local.getUTCHours()).padStart(2,'0')}:${String(local.getUTCMinutes()).padStart(2,'0')}`;
}

function makeRange(riseDate, setDate, seg, tzOffset) {
  const dayMs = setDate.getTime() - riseDate.getTime();
  const segMs = dayMs / 8;
  const start = new Date(riseDate.getTime() + seg * segMs);
  const end   = new Date(riseDate.getTime() + (seg + 1) * segMs);
  return { start: fmtTime(start, tzOffset), end: fmtTime(end, tzOffset) };
}

// ── Amanta Maas (correct lunar month for Maharashtra) ────────────
//
// Rule: a lunar month's name = the solar Rashi the Sun ENTERS
// during that month (i.e., the Sankranti that falls between the
// previous Amavasya and the next Amavasya).
//
// Algorithm:
//  1. Estimate JD of previous new moon (JD_prevNM) from elongation.
//  2. Estimate JD of next new moon   (JD_nextNM = JD_prevNM + 29.53).
//  3. Compare Sun's sidereal Rashi at both endpoints.
//  4. If it changed → Sun crossed into a new Rashi → month is named
//     after that new Rashi.
//  5. If it didn't change → no Sankranti this month = Adhika Maas.
//
function getAmantaMaas(moonSunDiff, JD) {
  const SYNODIC = 29.5306;

  // Previous new moon
  const daysSinceNM = moonSunDiff * (SYNODIC / 360);
  const JD_prevNM   = JD - daysSinceNM;

  // Next new moon
  const JD_nextNM   = JD_prevNM + SYNODIC;

  // Sidereal Sun at both new moons
  const sidStart = norm360(sunLongitude(JD_prevNM) - getLahiriAyanamsha(JD_prevNM));
  const sidEnd   = norm360(sunLongitude(JD_nextNM) - getLahiriAyanamsha(JD_nextNM));

  const rashiStart = Math.floor(sidStart / 30) % 12;
  const rashiEnd   = Math.floor(sidEnd   / 30) % 12;

  if (rashiEnd !== rashiStart) {
    // Sankranti fell within this month → named after the rashi entered
    return MAAS[rashiEnd];
  }
  // No Sankranti → Adhika (intercalary) month; carry forward same name
  return 'अधिक ' + MAAS[rashiStart];
}

// ── Festival / Special-day detection ────────────────────────────
//
// maasName   — Marathi month name (e.g. 'चैत्र')
// tithiNum   — 1–30
// paksha     — 'शुक्ल पक्ष' | 'कृष्ण पक्ष'
// weekDay    — 0 Sun … 6 Sat
// date       — JS Date (civil Gregorian)
// siderealSunDeg — Sun sidereal longitude (for Sankranti detection)
//
function getSpecialDays(maasName, tithiNum, paksha, weekDay, date, siderealSunDeg) {
  const events = [];
  const isShukla  = paksha === 'शुक्ल पक्ष';
  const isKrishna = !isShukla;

  // ── Helper ──────────────────────────────────────────────────
  const add = (name, icon, type = 'festival') => events.push({ name, icon, type });

  // ── Universal tithi events (every month) ───────────────────
  if (tithiNum === 15)  add('पौर्णिमा',          '🌕', 'special');
  if (tithiNum === 30)  add('अमावस्या',           '🌑', 'special');
  if (tithiNum === 11 && isShukla)  add('एकादशी (शुक्ल)', '🙏', 'vrat');
  if (tithiNum === 11 && isKrishna) add('एकादशी (कृष्ण)', '🙏', 'vrat');
  if (tithiNum ===  4 && isShukla)  add('विनायकी चतुर्थी', '🐘', 'vrat');
  if (tithiNum ===  4 && isKrishna) add('संकष्टी चतुर्थी',  '🐘', 'vrat');
  if (tithiNum ===  8)  add('अष्टमी',             '🌙', 'special');
  if (tithiNum === 13)  add('प्रदोष व्रत',         '🕉️', 'vrat');
  if (tithiNum === 28)  add('प्रदोष व्रत (कृष्ण)', '🕉️', 'vrat');
  if (tithiNum === 14 && isKrishna) add('शिवरात्री / मासिक शिवरात्री', '🕉️', 'vrat');

  // ── Major Hindu festivals (Maas + Tithi + Paksha) ──────────

  // चैत्र
  if (maasName === 'चैत्र') {
    if (tithiNum ===  1 && isShukla) add('गुढी पाडवा (हिंदू नूतन वर्ष)', '🎋', 'festival');
    if (tithiNum ===  3 && isShukla) add('गौरी तृतीया',                   '🌸', 'festival');
    if (tithiNum ===  6 && isShukla) add('यमुना षष्ठी',                   '🌊', 'special');
    if (tithiNum ===  9 && isShukla) add('रामनवमी',                        '🏹', 'festival');
    if (tithiNum === 15)             add('हनुमान जयंती / चैत्र पौर्णिमा',  '🚩', 'festival');
  }

  // वैशाख
  if (maasName === 'वैशाख') {
    if (tithiNum ===  3 && isShukla) add('अक्षय तृतीया (आखाजी)',           '✨', 'festival');
    if (tithiNum ===  6 && isShukla) add('परशुराम षष्ठी',                   '⚔️', 'festival');
    if (tithiNum === 14 && isShukla) add('नृसिंह चतुर्दशी',                 '🦁', 'festival');
    if (tithiNum === 15)             add('वैशाख पौर्णिमा / बुद्ध पौर्णिमा', '☸️', 'festival');
  }

  // ज्येष्ठ
  if (maasName === 'ज्येष्ठ') {
    if (tithiNum ===  5 && isShukla) add('वट पौर्णिमा / वट सावित्री व्रत (पूर्वार्ध)', '🌳', 'vrat');
    if (tithiNum === 13 && isShukla) add('प्रदोष व्रत',                      '🕉️', 'vrat');
    if (tithiNum === 15)             add('ज्येष्ठ पौर्णिमा / वट सावित्री',   '🌳', 'festival');
  }

  // आषाढ
  if (maasName === 'आषाढ') {
    if (tithiNum ===  2 && isShukla) add('आषाढी एकादशी (देवशयनी)',           '🙏', 'festival');
    if (tithiNum === 11 && isShukla) add('आषाढी एकादशी',                     '🙏', 'festival');
    if (tithiNum === 15)             add('आषाढ पौर्णिमा / गुरु पौर्णिमा',    '🪷', 'festival');
  }

  // श्रावण
  if (maasName === 'श्रावण') {
    if (tithiNum ===  5 && isShukla) add('नागपंचमी',                         '🐍', 'festival');
    if (tithiNum ===  6 && isShukla) add('सूर्य षष्ठी (हलषष्ठी)',            '☀️', 'special');
    if (tithiNum === 15)             add('रक्षाबंधन / नारळी पौर्णिमा',       '🤝', 'festival');
    // Shravan Somvar (Monday in Shravan)
    if (weekDay === 1)               add('श्रावण सोमवार',                     '🕉️', 'vrat');
    if (tithiNum ===  8 && isKrishna) add('कृष्ण जन्माष्टमी',                '🎉', 'festival');
  }

  // भाद्रपद
  if (maasName === 'भाद्रपद') {
    if (tithiNum ===  3 && isShukla) add('हरितालिका तीज',                    '🌿', 'festival');
    if (tithiNum ===  4 && isShukla) add('गणेश चतुर्थी',                     '🐘', 'festival');
    if (tithiNum ===  5 && isShukla) add('ऋषी पंचमी',                        '🌺', 'vrat');
    if (tithiNum ===  6 && isShukla) add('ललिता षष्ठी',                      '🌸', 'special');
    if (tithiNum === 14 && isShukla) add('अनंत चतुर्दशी (गणेश विसर्जन)',      '🐘', 'festival');
    if (tithiNum ===  8 && isKrishna) add('कृष्ण अष्टमी',                    '🎉', 'special');
    if (tithiNum === 15)             add('भाद्रपद पौर्णिमा',                  '🌕', 'special');
  }

  // आश्विन
  if (maasName === 'आश्विन') {
    if (tithiNum ===  1 && isShukla) add('शारदीय नवरात्री प्रारंभ',           '🔱', 'festival');
    if (tithiNum ===  2 && isShukla) add('नवरात्री द्वितीया',                 '🔱', 'festival');
    if (tithiNum ===  3 && isShukla) add('नवरात्री तृतीया',                   '🔱', 'festival');
    if (tithiNum ===  4 && isShukla) add('नवरात्री चतुर्थी',                  '🔱', 'festival');
    if (tithiNum ===  5 && isShukla) add('नवरात्री पंचमी',                    '🔱', 'festival');
    if (tithiNum ===  6 && isShukla) add('नवरात्री षष्ठी (सरस्वती पूजन)',     '📚', 'festival');
    if (tithiNum ===  7 && isShukla) add('नवरात्री सप्तमी',                   '🔱', 'festival');
    if (tithiNum ===  8 && isShukla) add('नवरात्री अष्टमी (दुर्गाष्टमी)',     '⚔️', 'festival');
    if (tithiNum ===  9 && isShukla) add('नवरात्री नवमी (महानवमी)',            '🔱', 'festival');
    if (tithiNum === 10 && isShukla) add('दसरा (विजयादशमी)',                   '⚔️', 'festival');
    if (tithiNum === 15)             add('कोजागिरी पौर्णिमा',                  '🌕', 'festival');
  }

  // कार्तिक
  if (maasName === 'कार्तिक') {
    if (tithiNum === 11 && isShukla) add('देवउठनी एकादशी (तुलसी विवाह)',      '🌿', 'festival');
    if (tithiNum === 13 && isKrishna) add('धनत्रयोदशी (धनतेरस)',              '🪔', 'festival');
    if (tithiNum === 14 && isKrishna) add('नरक चतुर्दशी (छोटी दिवाळी)',       '🪔', 'festival');
    if (tithiNum === 30)             add('दिवाळी / लक्ष्मीपूजन (अमावस्या)',    '🪔', 'festival');
    if (tithiNum ===  1 && isShukla) add('बलिप्रतिपदा (दिवाळी पाडवा)',         '🎊', 'festival');
    if (tithiNum ===  2 && isShukla) add('भाऊबीज (यम द्वितीया)',               '🤝', 'festival');
    if (tithiNum === 15)             add('कार्तिक पौर्णिमा / त्रिपुरी पौर्णिमा', '🌕', 'festival');
  }

  // मार्गशीर्ष
  if (maasName === 'मार्गशीर्ष') {
    if (weekDay === 4)               add('मार्गशीर्ष गुरुवार',                 '🪷', 'vrat');
    if (tithiNum === 15)             add('मार्गशीर्ष पौर्णिमा',                '🌕', 'special');
  }

  // पौष
  if (maasName === 'पौष') {
    if (tithiNum === 15)             add('पौष पौर्णिमा',                       '🌕', 'special');
  }

  // माघ
  if (maasName === 'माघ') {
    if (tithiNum ===  5 && isShukla) add('वसंत पंचमी (सरस्वती पूजन)',          '📚', 'festival');
    if (tithiNum === 14 && isKrishna) add('महाशिवरात्री',                      '🕉️', 'festival');
    if (tithiNum === 15)             add('माघ पौर्णिमा',                        '🌕', 'special');
  }

  // फाल्गुन
  if (maasName === 'फाल्गुन') {
    if (tithiNum === 15)             add('होळी पौर्णिमा (होलिका दहन)',          '🔥', 'festival');
    if (tithiNum === 30)             add('रंगपंचमी / धुळवड',                    '🎨', 'festival');
    // The day after Holi purnima — dhulvad falls on first after purnima
  }

  // ── Sankranti detection from Sun sidereal position ──────────
  // Each rashi entry = Sankranti; Sun crosses a 30° boundary today
  // Check: is Sun within 0.5° of a rashi boundary (0°,30°,60°…)?
  if (siderealSunDeg !== undefined) {
    const degInRashi = siderealSunDeg % 30;
    if (degInRashi < 0.85) {
      const rashiIdx = Math.floor(siderealSunDeg / 30) % 12;
      const SANKRANTI_NAMES = [
        'मेष संक्रांती',    'वृषभ संक्रांती',  'मिथुन संक्रांती',
        'कर्क संक्रांती',  'सिंह संक्रांती',  'कन्या संक्रांती',
        'तुला संक्रांती',  'वृश्चिक संक्रांती','धनु संक्रांती',
        'मकर संक्रांती',   'कुंभ संक्रांती',  'मीन संक्रांती',
      ];
      const SANKRANTI_ICONS = [
        '🐏','🐂','👫','🦀','🦁','👩‍🌾',
        '⚖️','🦂','🏹','🐊','🏺','🐟',
      ];
      add(SANKRANTI_NAMES[rashiIdx], SANKRANTI_ICONS[rashiIdx], 'festival');
    }
  }

  // ── Weekday-based devotional reminders ──────────────────────
  if (weekDay === 1) add('सोमवार — शिव उपासना शुभ',           '🕉️', 'info');
  if (weekDay === 2) add('मंगळवार — हनुमान / मंगळ पूजन शुभ', '🚩', 'info');
  if (weekDay === 4) add('गुरुवार — गुरु / विष्णू पूजन शुभ',  '🪷', 'info');
  if (weekDay === 5) add('शुक्रवार — लक्ष्मी पूजन शुभ',        '🪔', 'info');
  if (weekDay === 6) add('शनिवार — शनि / हनुमान उपासना',       '⚫', 'info');

  // ── Fixed Gregorian national / Maharashtra days ─────────────
  const m = date.getMonth() + 1, day = date.getDate();
  const gFests = {
    '1-1':   { name: 'नवीन वर्ष (ग्रेगोरियन)',           icon: '🎉' },
    '1-14':  { name: 'मकर संक्रांती',                    icon: '🪁' },
    '1-26':  { name: 'प्रजासत्ताक दिन',                  icon: '🇮🇳' },
    '2-19':  { name: 'छत्रपती शिवाजी महाराज जयंती',      icon: '⚔️' },
    '4-14':  { name: 'डॉ. बाबासाहेब आंबेडकर जयंती',      icon: '📚' },
    '5-1':   { name: 'महाराष्ट्र राज्य दिन',             icon: '🟠' },
    '8-15':  { name: 'स्वातंत्र्य दिन',                   icon: '🇮🇳' },
    '10-2':  { name: 'गांधी जयंती',                      icon: '🕊️' },
    '11-14': { name: 'बाल दिन',                           icon: '👶' },
  };
  const key = `${m}-${day}`;
  if (gFests[key]) add(gFests[key].name, gFests[key].icon, 'festival');

  return events;
}

// ── Main calculation ─────────────────────────────────────────────

/**
 * Calculate Panchang for a given date, location, and optional time.
 * @param {string}      dateStr  — "YYYY-MM-DD"
 * @param {number}      lat      — Latitude (decimal degrees)
 * @param {number}      lon      — Longitude (decimal degrees)
 * @param {number}      tzOffset — Local timezone offset in minutes (IST = 330)
 * @param {string|null} timeStr  — "HH:MM" local time (optional; defaults to sunrise)
 */
async function getPanchang(dateStr, lat, lon, tzOffset, timeStr) {
  const timeKey  = timeStr || 'sr';
  const cacheKey = `${dateStr}_${lat.toFixed(2)}_${lon.toFixed(2)}_${tzOffset}_${timeKey}`;
  const cached   = getCached(cacheKey);
  if (cached) return cached;

  const [y, mo, d] = dateStr.split('-').map(Number);

  // ── Sunrise / Sunset (SunCalc) ───────────────────────────────
  // Always computed at civil-day noon so we have muhurta times.
  const refDate  = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const sunTimes = SunCalc.getTimes(refDate, lat, lon);
  const riseDate = sunTimes.sunrise;
  const setDate  = sunTimes.sunset;

  const sunriseStr = (riseDate && !isNaN(riseDate)) ? fmtTime(riseDate, tzOffset) : '--';
  const sunsetStr  = (setDate  && !isNaN(setDate))  ? fmtTime(setDate,  tzOffset) : '--';

  // ── Calculation epoch ──────────────────────────────────────────
  // If user provides a time, use it (converts local→UTC).
  // Otherwise fall back to sunrise (traditional Hindu epoch).
  let calcDate;
  if (timeStr && /^\d{2}:\d{2}$/.test(timeStr)) {
    const [hh, mm] = timeStr.split(':').map(Number);
    calcDate = new Date(Date.UTC(y, mo - 1, d, hh, mm, 0) - tzOffset * 60000);
  } else if (riseDate && !isNaN(riseDate)) {
    calcDate = riseDate;
  } else {
    calcDate = new Date(Date.UTC(y, mo - 1, d, 6, 0, 0) - tzOffset * 60000);
  }
  const JD = toJD(calcDate);

  // ── Ayanamsha for this JD ────────────────────────────────────
  const ayanamsha = getLahiriAyanamsha(JD);

  // ── Sun & Moon tropical longitudes at sunrise ────────────────
  const sLong = sunLongitude(JD);
  const mLong = moonLongitude(JD);

  // ── Sidereal longitudes ──────────────────────────────────────
  const siderealSun  = norm360(sLong - ayanamsha);
  const siderealMoon = norm360(mLong - ayanamsha);

  // ── Tithi (based on tropical Moon–Sun elongation) ────────────
  // Tithi = floor((Moon_tropical - Sun_tropical) / 12) + 1  [1–30]
  let moonSunDiff = norm360(mLong - sLong);
  const tithiNum  = Math.floor(moonSunDiff / 12) + 1; // 1–30
  const tithi     = TITHIS[tithiNum - 1];

  // ── Paksha ───────────────────────────────────────────────────
  const paksha = PAKSHA[tithiNum <= 15 ? 0 : 1];

  // ── Nakshatra (sidereal Moon / 13°20') ───────────────────────
  const NAK_SIZE  = 360 / 27; // 13.3333...°
  const nakshatra = NAKSHATRAS[Math.floor(siderealMoon / NAK_SIZE) % 27];

  // ── Yoga (sidereal Sun + sidereal Moon / 13°20') ─────────────
  const yogaSum = norm360(siderealSun + siderealMoon);
  const yoga    = YOGAS[Math.floor(yogaSum / NAK_SIZE) % 27];

  // ── Karana (half-tithi) ──────────────────────────────────────
  // 11 karanas: Kimstughna (fixed first), 7 variable × 8 rounds, then Shakuni/Chatushpada/Naga
  const karanaHalf = Math.floor(moonSunDiff / 6); // 0–59
  let karanaIdx;
  if (karanaHalf === 0)      karanaIdx = 10;                        // Kimstughna
  else if (karanaHalf >= 57) karanaIdx = 7 + (karanaHalf - 57);    // Shakuni=7, Chatushpada=8, Naga=9
  else                       karanaIdx = (karanaHalf - 1) % 7;     // variable 0–6
  const karana = KARANAS[Math.min(karanaIdx, KARANAS.length - 1)];

  // ── Rashi ────────────────────────────────────────────────────
  const suryaRashi   = RASHIS[Math.floor(siderealSun  / 30) % 12];
  const chandraRashi = RASHIS[Math.floor(siderealMoon / 30) % 12];

  // ── Maas (Amanta / Maharashtra system) ──────────────────────
  // Month name = Sun's sidereal Rashi at the last new moon (Amavasya).
  const maas = getAmantaMaas(moonSunDiff, JD);

  // ── Var (weekday) ─────────────────────────────────────────────
  const weekDay = new Date(y, mo - 1, d).getDay(); // 0 = Sun
  const var_    = VAR[weekDay];

  // ── Muhurtas ─────────────────────────────────────────────────
  let rahuKaal = null, gulikaKaal = null, yamaganda = null, abhijitMuhurat = null;

  if (riseDate && setDate && !isNaN(riseDate) && !isNaN(setDate)) {
    rahuKaal       = makeRange(riseDate, setDate, RAHU_SEG[weekDay],      tzOffset);
    gulikaKaal     = makeRange(riseDate, setDate, GULIKA_SEG[weekDay],    tzOffset);
    yamaganda      = makeRange(riseDate, setDate, YAMAGANDA_SEG[weekDay], tzOffset);
    const solarNoon = new Date((riseDate.getTime() + setDate.getTime()) / 2);
    abhijitMuhurat  = {
      start: fmtTime(new Date(solarNoon.getTime() - 24 * 60000), tzOffset),
      end:   fmtTime(new Date(solarNoon.getTime() + 24 * 60000), tzOffset),
    };
  }

  // ── Lagna (Ascendant) — sidereal, time-sensitive ─────────────
  const lagnaTropical = getLagnaTropical(JD, lat, lon);
  const lagnaLong     = norm360(lagnaTropical - ayanamsha);
  const lagna         = RASHIS[Math.floor(lagnaLong / 30) % 12];
  const lagnaDegs     = (lagnaLong % 30).toFixed(2); // degrees within rashi

  // ── Special days ─────────────────────────────────────────────
  const festivals = getSpecialDays(maas, tithiNum, paksha, weekDay, new Date(y, mo - 1, d), siderealSun);

  // ── Shubh Muhurat recommendation ─────────────────────────────
  const inauspiciousYogaIdx = [8, 9, 16, 18, 26]; // Shula, Ganda, Vyatipata, Parigha, Vaidhriti
  const yogaIdx             = YOGAS.indexOf(yoga);
  const shubhMuhurat = inauspiciousYogaIdx.includes(yogaIdx)
    ? 'आज योग अशुभ आहे. महत्त्वाची कामे टाळा.'
    : abhijitMuhurat
      ? `अभिजित मुहूर्त (${abhijitMuhurat.start} – ${abhijitMuhurat.end}) आज शुभ आहे.`
      : 'सूर्योदयाची वेळ आज शुभ मुहूर्त आहे.';

  const result = {
    date:         dateStr,
    selectedTime: timeStr || null,
    var:          var_,
    paksha,
    maas,
    tithi:        { num: tithiNum, name: tithi },
    nakshatra,
    yoga,
    karana,
    suryaRashi,
    chandraRashi,
    lagna,
    lagnaDegs,
    sunrise:      sunriseStr,
    sunset:       sunsetStr,
    rahuKaal,
    gulikaKaal,
    yamaganda,
    abhijitMuhurat,
    festivals,
    shubhMuhurat,
    _ayanamsha:        ayanamsha.toFixed(4),
    _sun_sidereal:     siderealSun.toFixed(4),
    _moon_sidereal:    siderealMoon.toFixed(4),
    _moon_sun_diff:    moonSunDiff.toFixed(4),
    _lagna_tropical:   lagnaTropical.toFixed(2),
    _lagna_sidereal:   lagnaLong.toFixed(2),
    _calc_at:          calcDate.toISOString(),
  };

  setCache(cacheKey, result);
  return result;
}

function clearCache() { _cache.clear(); }

module.exports = { getPanchang, clearCache };
