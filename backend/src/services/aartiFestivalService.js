'use strict';
// aartiFestivalService.js — "आज कोणत्या देवतेचा दिवस/सण?" via the in-house
// panchang engine (calendar-accurate: tithi+maas+paksha), so the aarti list
// can put that deity's aartis first. No admin data-entry needed — dates come
// from the astronomical calculation, valid every year automatically.
const { getPanchang } = require('./panchangService');
const { getCache, setCache } = require('../utils/redis');

// Pune — panchang reference point for Maharashtra-wide festivals
const LAT = 18.5204, LON = 73.8567, TZ = 5.5;

// tithi.num convention (verified against panchangService output): CONTINUOUS
// 1-30 — शुक्ल प्रतिपदा=1 … पौर्णिमा=15, कृष्ण प्रतिपदा=16 … चतुर्दशी=29, अमावस्या=30.
// Months are AMANTA (Maharashtra) — so दिवाळी falls in आश्विन कृष्ण, not कार्तिक.
//
// Rules are evaluated top-to-bottom; FIRST match wins.
// day: exact tithi | range: [from,to] inclusive | whole month if neither.
const RULES = [
  // ── Specific days (override the period/month rules below) ──
  { maas: 'श्रावण',     day: 23,          deity: 'कृष्ण',           festival: 'गोकुळाष्टमी',                    icon: '🎉' },  // कृष्ण अष्टमी
  { maas: 'चैत्र',      day: 9,           deity: 'राम',             festival: 'रामनवमी',                        icon: '🏹' },
  { maas: 'चैत्र',      day: 15,          deity: 'इतर देवता',       festival: 'हनुमान जयंती',                   icon: '🚩' },
  { maas: 'मार्गशीर्ष', day: 15,          deity: 'इतर देवता',       festival: 'दत्त जयंती',                     icon: '🪷' },
  { maas: 'मार्गशीर्ष', day: 6,           deity: 'इतर देवता',       festival: 'चंपाषष्ठी (खंडोबा)',              icon: '🚩' },
  { maas: 'माघ',        day: 29,          deity: 'शिव',             festival: 'महाशिवरात्री',                   icon: '🕉️' },  // कृष्ण चतुर्दशी
  { maas: 'कार्तिक',    range: [11, 12],  deity: 'विठ्ठल-पांडुरंग', festival: 'कार्तिकी एकादशी / तुळशी विवाह',   icon: '🌿' },
  { maas: 'आषाढ',       range: [10, 12],  deity: 'विठ्ठल-पांडुरंग', festival: 'आषाढी एकादशी (वारी)',            icon: '🙏' },

  // ── Festival periods ──
  { maas: 'भाद्रपद',    range: [4, 14],   deity: 'गणपती',      festival: 'गणेशोत्सव',                      icon: '🐘' },
  { maas: 'आश्विन',     range: [1, 10],   deity: 'देवी',       festival: 'शारदीय नवरात्रोत्सव',             icon: '🔱' },
  { maas: 'चैत्र',      range: [1, 9],    deity: 'देवी',       festival: 'चैत्र नवरात्र',                   icon: '🔱' },
  // दिवाळी: धनत्रयोदशी (आश्विन कृ. त्रयोदशी=28) → लक्ष्मीपूजन (अमावस्या=30) → पाडवा-भाऊबीज (कार्तिक शु. 1-2)
  { maas: 'आश्विन',     range: [28, 30],  deity: 'देवी',       festival: 'दिवाळी',                          icon: '🪔' },
  { maas: 'कार्तिक',    range: [1, 2],    deity: 'देवी',       festival: 'दिवाळी (पाडवा-भाऊबीज)',           icon: '🪔' },

  // ── Whole-month / weekday observances ──
  { maas: 'श्रावण',                       deity: 'शिव',        festival: 'श्रावण मास',                      icon: '🕉️' },
  { maas: 'मार्गशीर्ष', weekDay: 4,       deity: 'देवी',       festival: 'मार्गशीर्ष गुरुवार (महालक्ष्मी व्रत)', icon: '🪷' },
];

function matchRule(maas, tithiNum, weekDay) {
  for (const r of RULES) {
    if (r.maas !== maas) continue;
    if (r.day !== undefined && r.day !== tithiNum) continue;
    if (r.range && (tithiNum < r.range[0] || tithiNum > r.range[1])) continue;
    if (r.weekDay !== undefined && r.weekDay !== weekDay) continue;
    return { deity: r.deity, festival: r.festival, icon: r.icon };
  }
  return null;
}

// Resolve for an arbitrary date (exported for tests); no redis here.
async function getFestivalForDate(dateStr) {
  const p = await getPanchang(dateStr, LAT, LON, TZ);
  const weekDay = new Date(dateStr + 'T12:00:00').getDay();
  return matchRule(p.maas, p.tithi.num, weekDay);
}

// Today's festival, redis-cached for 6h (tithi can change mid-day at most once)
async function getTodayFestival() {
  const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const key = `aarti:festival:${dateStr}`;
  const cached = await getCache(key);
  if (cached) return cached.none ? null : cached;

  let fest = null;
  try { fest = await getFestivalForDate(dateStr); }
  catch (e) { console.error('aartiFestival panchang error:', e.message); }

  await setCache(key, fest || { none: true }, 6 * 60 * 60);
  return fest;
}

module.exports = { getTodayFestival, getFestivalForDate };
