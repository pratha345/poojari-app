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
  return 23.85 + (JD - 2451545.0) * 50.27 / (365.25 * 3600.0);
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

// Birth-star details (Avakahada chakra)
const NAAM_AKSHAR = [
  ['चू','चे','चो','ला'],['ली','लू','ले','लो'],['अ','ई','उ','ए'],['ओ','वा','वी','वू'],
  ['वे','वो','का','की'],['कू','घ','ङ','छ'],['के','को','हा','ही'],['हू','हे','हो','डा'],
  ['डी','डू','डे','डो'],['मा','मी','मू','मे'],['मो','टा','टी','टू'],['टे','टो','पा','पी'],
  ['पू','ष','ण','ठ'],['पे','पो','रा','री'],['रू','रे','रो','ता'],['ती','तू','ते','तो'],
  ['ना','नी','नू','ने'],['नो','या','यी','यू'],['ये','यो','भा','भी'],['भू','धा','फा','ढा'],
  ['भे','भो','जा','जी'],['खी','खू','खे','खो'],['गा','गी','गु','गे'],['गो','सा','सी','सू'],
  ['से','सो','दा','दी'],['दू','थ','झ','ञ'],['दे','दो','चा','ची'],
];
const RASHI_SYMBOL = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const RASHI_SWAMI  = ['मंगळ','शुक्र','बुध','चंद्र','सूर्य','बुध','शुक्र','मंगळ','गुरु','शनि','शनि','गुरु'];
// Varna by rashi element: fire=क्षत्रिय, earth=वैश्य, air=शूद्र, water=ब्राह्मण
const VARNA_NAMES  = ['क्षत्रिय','वैश्य','शूद्र','ब्राह्मण'];
const GANA_NAMES   = ['देव','मनुष्य','राक्षस'];
const NAK_GANA     = [0,1,2,1,0,1,0,0,2,2,1,1,0,2,0,2,0,2,2,1,1,0,2,2,1,1,0];
const YONI_NAMES   = ['अश्व','गज','मेष','सर्प','श्वान','मार्जार','मूषक','गौ','महिष','व्याघ्र','मृग','वानर','नकुल','सिंह'];
const NAK_YONI     = [0,1,2,3,3,4,5,2,5,6,6,7,8,9,8,9,10,10,4,11,12,11,13,0,13,7,1];
const NADI_NAMES   = ['आद्य (वात)','मध्य (पित्त)','अन्त्य (कफ)'];
const NAK_NADI     = [0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2];
// Nakshatra paya: सुवर्ण Revati–Bharani, लोह Krittika–Mrigashira,
// रजत Ardra–Anuradha, ताम्र Jyeshtha–Uttara Bhadrapada
const PAYA_NAMES   = ['सुवर्ण','रजत','ताम्र','लोह'];
const NAK_PAYA     = [0,0,3,3,3,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,0];

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

  const geoLon = body => Astro.Ecliptic(Astro.GeoVector(body, t, true)).elon;
  const moon   = Astro.EclipticGeoMoon(t);
  const rahuT  = rahuMeanLon(t);

  return [
    { ...PLANETS[0], tropical: geoLon('Sun'),     rashiIdx: sid(geoLon('Sun')),     degree: deg(geoLon('Sun'))     },
    { ...PLANETS[1], tropical: moon.lon,           rashiIdx: sid(moon.lon),          degree: deg(moon.lon)          },
    { ...PLANETS[2], tropical: geoLon('Mars'),     rashiIdx: sid(geoLon('Mars')),    degree: deg(geoLon('Mars'))    },
    { ...PLANETS[3], tropical: geoLon('Mercury'),  rashiIdx: sid(geoLon('Mercury')), degree: deg(geoLon('Mercury')) },
    { ...PLANETS[4], tropical: geoLon('Jupiter'),  rashiIdx: sid(geoLon('Jupiter')), degree: deg(geoLon('Jupiter')) },
    { ...PLANETS[5], tropical: geoLon('Venus'),    rashiIdx: sid(geoLon('Venus')),   degree: deg(geoLon('Venus'))   },
    { ...PLANETS[6], tropical: geoLon('Saturn'),   rashiIdx: sid(geoLon('Saturn')),  degree: deg(geoLon('Saturn'))  },
    { ...PLANETS[7], tropical: rahuT,               rashiIdx: sid(rahuT),             degree: deg(rahuT)             },
    { ...PLANETS[8], tropical: norm(rahuT + 180),   rashiIdx: sid(norm(rahuT + 180)), degree: deg(norm(rahuT + 180)) },
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
  // atan2(cos(RAMC), -(sin(RAMC)*cos(ε)+tan(φ)*sin(ε))) = Swiss Ephemeris standard for Ascendant
  let asc = toDeg(Math.atan2(Math.cos(ramcR), -(Math.sin(ramcR) * Math.cos(epsR) + Math.tan(latR) * Math.sin(epsR))));
  if (asc < 0) asc += 360;
  asc = norm(asc);

  const ayan    = lahiriAyanamsha(utcDate);
  const sidAsc  = norm(asc - ayan);
  const rashiIdx = Math.floor(sidAsc / 30);
  return { tropical: +asc.toFixed(4), sidereal: +sidAsc.toFixed(4), rashiIdx, degree: +(sidAsc % 30).toFixed(2) };
}

// Karana: 60 half-tithis per lunar month. #0 is Kimstughna, #1–56 cycle the
// 7 movable karanas starting from Bava, #57–59 are Shakuni, Chatushpada, Naga.
function karanaName(moonSun) {
  const n = Math.floor(moonSun / 6);           // 0–59
  if (n === 0) return KARANA[10];              // किंस्तुघ्न
  if (n >= 57) return KARANA[7 + (n - 57)];    // शकुनि, चतुष्पाद, नाग
  return KARANA[(n - 1) % 7];
}

const sunSidAt = t => {
  const ut = t.date;
  return norm(Astro.Ecliptic(Astro.GeoVector('Sun', t, true)).elon - lahiriAyanamsha(ut));
};

// Amanta lunar month (as used in Maharashtra): named from the Sun's sidereal
// rashi at the new moon that begins it. Two new moons in one rashi → अधिक मास.
function lunarMonth(utcDate) {
  const t     = Astro.MakeTime(utcDate);
  const start = Astro.SearchMoonPhase(0, t, -32);   // most recent new moon (search backward)
  const next  = Astro.SearchMoonPhase(0, t, 32);
  const r1 = Math.floor(sunSidAt(start) / 30);
  const r2 = Math.floor(sunSidAt(next) / 30);
  return { idx: r1, name: HIN_MAS[r1], adhik: r1 === r2 };
}

// Hindu vara runs sunrise to sunrise, so a birth before local sunrise
// belongs to the previous weekday.
// Sunrise as Marathi panchangs define it: centre of the Sun's disc on the
// horizon, with 34' of atmospheric refraction.
function hinduSunrise(fromUtc, lat, lon) {
  const obs = new Astro.Observer(lat, lon, 0);
  return Astro.SearchAltitude('Sun', obs, +1, Astro.MakeTime(fromUtc), 1, -34 / 60);
}

function hinduVara(dob, utcDate, lat, lon, tzOffset = 330) {
  const [y, mo, d] = dob.split('-').map(Number);
  const civilDow   = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  const localMidnightUtc = new Date(Date.UTC(y, mo - 1, d) - tzOffset * 60000);
  const sunrise = hinduSunrise(localMidnightUtc, lat, lon);
  const before  = sunrise && utcDate < sunrise.date;
  return { vara: VARA[(civilDow + (before ? 6 : 0)) % 7], sunrise: sunrise ? sunrise.date : null };
}

function getPanchang(moonSid, sunSid, utcDate, lat, lon, dob) {
  const moonSun   = norm(moonSid - sunSid);
  const tithiNum  = Math.floor(moonSun / 12) + 1;            // 1–30
  const paksha    = tithiNum <= 15 ? 'शुक्ल' : 'कृष्ण';
  const tithiName = tithiNum === 30 ? 'अमावस्या' : TITHI[(tithiNum - 1) % 15];

  const yogaIdx   = Math.floor(norm(moonSid + sunSid) / (360 / 27));
  const yoga      = YOGA[yogaIdx];
  const karana    = karanaName(moonSun);

  const { vara, sunrise } = hinduVara(dob, utcDate, lat, lon);

  const month     = lunarMonth(utcDate);
  const mas       = (month.adhik ? 'अधिक ' : '') + month.name;

  // Shaka year starts at Chaitra Shukla Pratipada (Gudi Padwa). Early in the
  // Gregorian year, months before Chaitra still belong to the previous Shaka year.
  const yr        = utcDate.getUTCFullYear();
  const beforeNewYear = utcDate.getUTCMonth() <= 3 && month.idx >= 7 && month.idx <= 10;
  const shaka     = yr - (beforeNewYear ? 79 : 78);
  const samvat    = shaka + 135;                              // Vikram Samvat

  // Nakshatra details
  const nakSpan   = 360 / 27;
  const nakIdx    = Math.floor(moonSid / nakSpan);
  const moonInNak = moonSid % nakSpan;
  const pada      = Math.floor(moonInNak / (nakSpan / 4)) + 1;

  return { tithiNum, tithiName, paksha, yoga, karana, vara, sunrise, mas, samvat, shaka, nakIdx, nakName: NAKSHATRA[nakIdx], pada };
}

const dms = d => `${Math.floor(d)}°${String(Math.floor((d % 1) * 60)).padStart(2, '0')}'`;

function yearsToYMD(yrs) {
  const y  = Math.floor(yrs);
  const mf = (yrs - y) * 12;
  const m  = Math.floor(mf);
  const d  = Math.floor((mf - m) * 30);
  return { y, m, d, text: `${y} वर्षे ${m} महिने ${d} दिवस` };
}

// Ishtakal: time from sunrise to birth in ghati:pala:vipala (1 ghati = 24 min).
// A birth before sunrise counts from the previous day's sunrise.
function ishtakal(utcDate, sunriseDate, lat, lon) {
  let sr = sunriseDate;
  if (sr && utcDate < sr) {
    const prev = hinduSunrise(new Date(sr.getTime() - 30 * 3600 * 1000), lat, lon);
    if (prev) sr = prev.date;
  }
  if (!sr) return null;
  const vip = Math.floor((utcDate - sr) / 400);                // 1 vipala = 0.4 s
  const gh = Math.floor(vip / 3600), pa = Math.floor((vip % 3600) / 60), vi = vip % 60;
  const p2 = n => String(n).padStart(2, '0');
  return `${p2(gh)}:${p2(pa)}:${p2(vi)}`;
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

  return { balance: { lord: DASHA_LORDS[lordIdx], years: remaining, exactYears: totalYrs - elapsed }, current, sequence };
}

// ── Public API ─────────────────────────────────────────────

function generateJanamPatrika({ name, dob, tob, place, lat, lon }) {
  const utcDate  = toUtcDate(dob, tob);
  const t        = Astro.MakeTime(utcDate);
  const ayan     = lahiriAyanamsha(utcDate);

  const moon     = Astro.EclipticGeoMoon(t);
  const sunTrop  = Astro.Ecliptic(Astro.GeoVector('Sun', t, true)).elon;
  const moonSid  = norm(moon.lon  - ayan);
  const sunSid   = norm(sunTrop   - ayan);

  const planets  = getAllPlanets(utcDate);
  const lagna    = getLagna(utcDate, lat, lon);
  const panchang = getPanchang(moonSid, sunSid, utcDate, lat, lon, dob);
  const dasha    = getDasha(panchang.nakIdx, moonSid, utcDate);

  // Group planets by HOUSE (North Indian rotating chart, H1 = Lagna sign)
  const byHouse = {};
  for (let h = 1; h <= 12; h++) byHouse[h] = [];
  planets.forEach(p => {
    const h = ((p.rashiIdx - lagna.rashiIdx + 12) % 12) + 1;
    byHouse[h].push(p.short);
  });
  byHouse[1] = ['ल', ...byHouse[1]]; // Lagna marker in H1

  // Avakahada / birth-star details, laid out like a traditional Marathi kundali
  const moonRashi = Math.floor(moonSid / 30);
  const nakIdx    = panchang.nakIdx;
  const akshar    = NAAM_AKSHAR[nakIdx][panchang.pada - 1];
  const mars      = planets.find(p => p.key === 'mars');
  const marsFromLagna = ((mars.rashiIdx - lagna.rashiIdx + 12) % 12) + 1;
  const marsFromMoon  = ((mars.rashiIdx - moonRashi + 12) % 12) + 1;
  const doshHouses    = [1, 2, 4, 7, 8, 12];
  const hhmm = d => (d ? new Date(d.getTime() + 330 * 60000).toISOString().slice(11, 16) : '—');
  const details = {
    rashi:          `${RASHI_SYMBOL[moonRashi]} ${RASHI[moonRashi]}`,
    naamAkshar:     akshar,
    lagna:          `${RASHI_SYMBOL[lagna.rashiIdx]} ${RASHI[lagna.rashiIdx]} ${dms(lagna.degree)}`,
    dashaBhogya:    `${dasha.balance.lord} ${yearsToYMD(dasha.balance.exactYears).text}`,
    mangalDosh:     doshHouses.includes(marsFromLagna),
    mangalDoshNote: `मंगळ लग्नापासून ${marsFromLagna} व्या आणि चंद्रापासून ${marsFromMoon} व्या स्थानी`,
    tithi:          `${panchang.tithiName}, ${panchang.paksha}`,
    nakshatraPad:   `${panchang.nakName} ${panchang.pada} (${akshar})`,
    yoga:           panchang.yoga,
    karana:         panchang.karana,
    ishtakal:       ishtakal(utcDate, panchang.sunrise, lat, lon),
    sunrise:        hhmm(panchang.sunrise),
    varMasShaka:    `${panchang.vara}, ${panchang.mas}, ${panchang.shaka} शक संवत`,
    rashiSwami:     RASHI_SWAMI[moonRashi],
    nakshatraSwami: DASHA_LORDS[NAK_LORD[nakIdx]],
    paya:           PAYA_NAMES[NAK_PAYA[nakIdx]],
    yoni:           YONI_NAMES[NAK_YONI[nakIdx]],
    gana:           GANA_NAMES[NAK_GANA[nakIdx]],
    nadi:           NADI_NAMES[NAK_NADI[nakIdx]],
    varna:          VARNA_NAMES[moonRashi % 4],
  };

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
      shaka:    panchang.shaka,
      paksha:   panchang.paksha,
      tithi:    `${panchang.tithiName} (${panchang.tithiNum})`,
      nakshatra:`${panchang.nakName} (${panchang.pada}. चरण)`,
      rashi:    RASHI[Math.floor(moonSid / 30)],
      lagna:    `${RASHI[lagna.rashiIdx]} ${dms(lagna.degree)}`,
      yoga:     panchang.yoga,
      karana:   panchang.karana,
    },
    details,
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
