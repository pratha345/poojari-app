'use strict';
// ═══════════════════════════════════════════════════════════
// Janam Patrika Service — Complete Vedic Astrology Engine
// Uses astronomy-engine (JPL-level accuracy) + Lahiri Ayanamsha
// ═══════════════════════════════════════════════════════════
const Astro = require('astronomy-engine');

// ── Helpers ────────────────────────────────────────────────
const toRad = x => x * Math.PI / 180;
const toDeg = x => x * 180 / Math.PI;
const norm  = d => ((d % 360) + 360) % 360;

function lahiriAyanamsha(utcDate) {
  const JD = Astro.MakeTime(utcDate).tt + 2451545.0;
  return 23.85 + (JD - 2451545.0) * 50.27 / (36525.0 * 3600.0);
}

function toUtcDate(dob, tob = '12:00', tzOffset = 330) {
  const [y, mo, d] = dob.split('-').map(Number);
  const [h, m]     = (tob || '12:00').split(':').map(Number);
  const utcMin     = h * 60 + m - tzOffset;
  const dayOff     = utcMin < 0 ? -1 : utcMin >= 1440 ? 1 : 0;
  const um         = ((utcMin % 1440) + 1440) % 1440;
  return new Date(Date.UTC(y, mo - 1, d + dayOff, Math.floor(um / 60), um % 60));
}

// ── Lookup Tables ──────────────────────────────────────────
const NAKSHATRA = [
  'अश्विनी','भरणी','कृत्तिका','रोहिणी','मृगशिरा','आर्द्रा',
  'पुनर्वसु','पुष्य','अश्लेषा','मघा','पूर्वा फाल्गुनी','उत्तरा फाल्गुनी',
  'हस्त','चित्रा','स्वाती','विशाखा','अनुराधा','ज्येष्ठा',
  'मूळ','पूर्वाषाढा','उत्तराषाढा','श्रवण','धनिष्ठा','शतभिषा',
  'पूर्वाभाद्रपदा','उत्तराभाद्रपदा','रेवती',
];
const RASHI = ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुंभ','मीन'];
const RASHI_EN = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrischika','Dhanu','Makara','Kumbha','Meena'];
const VARA    = ['रविवार','सोमवार','मंगळवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];
const TITHI   = ['प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पंचमी','षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी','एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी','पौर्णिमा'];
const YOGA    = ['विष्कुंभ','प्रीति','आयुष्मान','सौभाग्य','शोभन','अतिगंड','सुकर्मा','धृति','शूल','गंड','वृद्धि','ध्रुव','व्याघात','हर्षण','वज्र','सिद्धि','व्यतिपात','वरीयान','परिघ','शिव','सिद्ध','साध्य','शुभ','शुक्ल','ब्रह्म','इंद्र','वैधृति'];
const KARANA  = ['बव','बालव','कौलव','तैतिल','गर','वणिज','विष्टि','शकुनि','चतुष्पाद','नाग','किंस्तुघ्न'];
// Sun in Aries(0)=Vaishakh, Taurus(1)=Jyeshtha … Pisces(11)=Chaitra
const HIN_MAS = ['वैशाख','ज्येष्ठ','आषाढ','श्रावण','भाद्रपद','आश्विन','कार्तिक','मार्गशीर्ष','पौष','माघ','फाल्गुन','चैत्र'];

// Vimshottari Dasha
const DASHA_LORDS = ['केतू','शुक्र','सूर्य','चंद्र','मंगळ','राहू','गुरु','शनि','बुध'];
const DASHA_YRS   = [7, 20, 6, 10, 7, 18, 16, 19, 17];
const NAK_LORD    = [0,1,2,3,4,5,6,7,8,0,1,2,3,4,5,6,7,8,0,1,2,3,4,5,6,7,8];

// Planet metadata
const PLANETS = [
  { key:'sun',     name:'सूर्य',  short:'सू' },
  { key:'moon',    name:'चंद्र',  short:'च'  },
  { key:'mars',    name:'मंगळ',   short:'मं' },
  { key:'mercury', name:'बुध',    short:'बु' },
  { key:'jupiter', name:'गुरु',   short:'गु' },
  { key:'venus',   name:'शुक्र',  short:'शु' },
  { key:'saturn',  name:'शनि',    short:'श'  },
  { key:'rahu',    name:'राहू',   short:'रा' },
  { key:'ketu',    name:'केतू',   short:'के' },
];

// ── Calculations ───────────────────────────────────────────

function rahuMeanLon(astroTime) {
  const T = astroTime.tt / 36525.0;
  return norm(125.0445479 - 1934.1362608 * T + 0.0020754 * T * T);
}

function getAllPlanets(utcDate) {
  const t    = Astro.MakeTime(utcDate);
  const ayan = lahiriAyanamsha(utcDate);
  const sid  = lon => Math.floor(norm(lon - ayan) / 30);
  const deg  = lon => +(norm(lon - ayan) % 30).toFixed(2);

  const geoLon = body => Astro.Ecliptic(Astro.GeoVector(body, t, false)).elon;
  const moon   = Astro.EclipticGeoMoon(t);
  const rahuT  = rahuMeanLon(t);

  return [
    { ...PLANETS[0], tropical: geoLon('Sun'),                  rashiIdx: sid(geoLon('Sun')),                 degree: deg(geoLon('Sun'))    },
    { ...PLANETS[1], tropical: moon.lon,                        rashiIdx: sid(moon.lon),                      degree: deg(moon.lon)         },
    { ...PLANETS[2], tropical: Astro.EclipticLongitude('Mars',    t), rashiIdx: sid(Astro.EclipticLongitude('Mars',    t)), degree: deg(Astro.EclipticLongitude('Mars',    t)) },
    { ...PLANETS[3], tropical: Astro.EclipticLongitude('Mercury', t), rashiIdx: sid(Astro.EclipticLongitude('Mercury', t)), degree: deg(Astro.EclipticLongitude('Mercury', t)) },
    { ...PLANETS[4], tropical: Astro.EclipticLongitude('Jupiter', t), rashiIdx: sid(Astro.EclipticLongitude('Jupiter', t)), degree: deg(Astro.EclipticLongitude('Jupiter', t)) },
    { ...PLANETS[5], tropical: Astro.EclipticLongitude('Venus',   t), rashiIdx: sid(Astro.EclipticLongitude('Venus',   t)), degree: deg(Astro.EclipticLongitude('Venus',   t)) },
    { ...PLANETS[6], tropical: Astro.EclipticLongitude('Saturn',  t), rashiIdx: sid(Astro.EclipticLongitude('Saturn',  t)), degree: deg(Astro.EclipticLongitude('Saturn',  t)) },
    { ...PLANETS[7], tropical: rahuT,                           rashiIdx: sid(rahuT),                         degree: deg(rahuT)            },
    { ...PLANETS[8], tropical: norm(rahuT + 180),               rashiIdx: sid(norm(rahuT + 180)),             degree: deg(norm(rahuT + 180)) },
  ];
}

function getLagna(utcDate, lat, lon) {
  const t    = Astro.MakeTime(utcDate);
  const gast = Astro.SiderealTime(t);                       // hours
  const lst  = ((gast + lon / 15) % 24 + 24) % 24;        // local sidereal time
  const ramc = lst * 15;                                    // RAMC in degrees
  const T    = t.tt / 36525.0;
  const eps  = 23.4392911 - 0.013005 * T;

  const ramcR = toRad(ramc), epsR = toRad(eps), latR = toRad(lat);
  let asc = toDeg(Math.atan2(-Math.cos(ramcR), Math.sin(ramcR) * Math.cos(epsR) + Math.tan(latR) * Math.sin(epsR)));
  if (asc < 0) asc += 360;
  if (Math.sin(ramcR) < 0) asc += 180;
  asc = norm(asc);

  const ayan    = lahiriAyanamsha(utcDate);
  const sidAsc  = norm(asc - ayan);
  const rashiIdx = Math.floor(sidAsc / 30);
  return { tropical: +asc.toFixed(4), sidereal: +sidAsc.toFixed(4), rashiIdx, degree: +(sidAsc % 30).toFixed(2) };
}

function getPanchang(moonSid, sunSid, utcDate, lat, lon) {
  const moonSun   = norm(moonSid - sunSid);
  const tithiNum  = Math.floor(moonSun / 12) + 1;            // 1–30
  const paksha    = tithiNum <= 15 ? 'शुक्ल' : 'कृष्ण';
  const tithiName = TITHI[(tithiNum - 1) % 15];

  const yogaIdx   = Math.floor(norm(moonSid + sunSid) / (360 / 27));
  const yoga      = YOGA[yogaIdx];

  const karanaNum = Math.floor(moonSun / 6);
  const karana    = KARANA[karanaNum % 7];

  const vara      = VARA[utcDate.getDay()];

  // Hindu month from Sun's sidereal rashi
  const sunRashi  = Math.floor(sunSid / 30);
  const mas       = HIN_MAS[sunRashi];

  // Vikram Samvat
  const yr        = utcDate.getFullYear();
  const mo        = utcDate.getMonth() + 1;
  const samvat    = yr + (mo >= 4 ? 57 : 56);

  // Nakshatra details
  const nakSpan   = 360 / 27;
  const nakIdx    = Math.floor(moonSid / nakSpan);
  const moonInNak = moonSid % nakSpan;
  const pada      = Math.floor(moonInNak / (nakSpan / 4)) + 1;

  return { tithiNum, tithiName, paksha, yoga, karana, vara, mas, samvat, nakIdx, nakName: NAKSHATRA[nakIdx], pada };
}

function getDasha(nakIdx, moonSid, birthDate) {
  const nakSpan      = 360 / 27;
  const moonInNak    = moonSid % nakSpan;
  const lordIdx      = NAK_LORD[nakIdx];
  const totalYrs     = DASHA_YRS[lordIdx];
  const elapsed      = totalYrs * (moonInNak / nakSpan);
  const remaining    = +(totalYrs - elapsed).toFixed(2);

  const MS_PER_YR    = 365.25 * 24 * 3600 * 1000;
  const bd           = new Date(birthDate);
  // Start of current dasha = birth date minus elapsed years
  let dashStart      = new Date(bd.getTime() - elapsed * MS_PER_YR);

  const sequence = [];
  for (let i = 0; i < 9; i++) {
    const idx    = (lordIdx + i) % 9;
    const yrs    = DASHA_YRS[idx];
    const end    = new Date(dashStart.getTime() + yrs * MS_PER_YR);
    sequence.push({
      lord:  DASHA_LORDS[idx],
      years: yrs,
      start: dashStart.toISOString().split('T')[0],
      end:   end.toISOString().split('T')[0],
    });
    dashStart = end;
  }

  // Current dasha = first entry that contains today
  const today     = new Date();
  const current   = sequence.find(d => new Date(d.start) <= today && today < new Date(d.end)) || sequence[0];

  return { balance: { lord: DASHA_LORDS[lordIdx], years: remaining }, current, sequence };
}

// ── Public API ─────────────────────────────────────────────

function generateJanamPatrika({ name, dob, tob, place, lat, lon }) {
  const utcDate  = toUtcDate(dob, tob);
  const t        = Astro.MakeTime(utcDate);
  const ayan     = lahiriAyanamsha(utcDate);

  const moon     = Astro.EclipticGeoMoon(t);
  const sunTrop  = Astro.Ecliptic(Astro.GeoVector('Sun', t, false)).elon;
  const moonSid  = norm(moon.lon  - ayan);
  const sunSid   = norm(sunTrop   - ayan);

  const planets  = getAllPlanets(utcDate);
  const lagna    = getLagna(utcDate, lat, lon);
  const panchang = getPanchang(moonSid, sunSid, utcDate, lat, lon);
  const dasha    = getDasha(panchang.nakIdx, moonSid, dob);

  // Group planets by HOUSE (North Indian rotating chart, H1 = Lagna sign)
  const byHouse = {};
  for (let h = 1; h <= 12; h++) byHouse[h] = [];
  planets.forEach(p => {
    const h = ((p.rashiIdx - lagna.rashiIdx + 12) % 12) + 1;
    byHouse[h].push(p.short);
  });
  byHouse[1] = ['ल', ...byHouse[1]]; // Lagna marker in H1

  // Also keep byRashi for Rashi chart (South Indian fixed)
  const byRashi = {};
  for (let i = 0; i < 12; i++) byRashi[i] = [];
  planets.forEach(p => byRashi[p.rashiIdx].push(p.short));
  byRashi[lagna.rashiIdx] = ['ल', ...byRashi[lagna.rashiIdx]];

  return {
    info:    { name, dob, tob, place, lat, lon },
    panchang: {
      vara:     panchang.vara,
      mas:      panchang.mas,
      samvat:   panchang.samvat,
      paksha:   panchang.paksha,
      tithi:    `${panchang.tithiName} (${panchang.tithiNum})`,
      nakshatra:`${panchang.nakName} (${panchang.pada}. चरण)`,
      rashi:    RASHI[Math.floor(moonSid / 30)],
      lagna:    `${RASHI[lagna.rashiIdx]} ${lagna.degree}°`,
      yoga:     panchang.yoga,
      karana:   panchang.karana,
    },
    lagna,
    planets,
    byHouse,
    byRashi,
    lagnaRashiIdx: lagna.rashiIdx,
    dasha,
    ayanamsha: +ayan.toFixed(4),
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { generateJanamPatrika, RASHI, NAKSHATRA, PLANETS, DASHA_LORDS };
