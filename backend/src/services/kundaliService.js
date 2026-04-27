// src/services/kundaliService.js — कुंडली मिलान (गुण मिलान) सेवा
// Ashta Koota Gun Milan system — complete implementation
'use strict';

// ═══════════════════════════════════════════════════════════════
// ASTRONOMICAL CORE  (standalone — no external deps)
// ═══════════════════════════════════════════════════════════════

const AYANAMSHA = 23.85; // Lahiri ayanamsha (approx for 2020–2030)

function norm360(d) { return ((d % 360) + 360) % 360; }

/** Gregorian date + time (UTC) → Julian Day Number */
function toJD(year, month, day, hour = 12, min = 0) {
  let Y = year, M = month;
  const D = day + (hour + min / 60) / 24;
  if (M <= 2) { Y--; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
}

/** Moon's tropical ecliptic longitude (Meeus Ch. 47, ~5' accuracy) */
function moonLongitude(JD) {
  const T = (JD - 2451545.0) / 36525.0;
  const L1 = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841;
  const Ms  = norm360(357.5291092 + 35999.0502909 * T);
  const Mm  = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T);
  const Dv  = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T);
  const Fv  = norm360(93.2720950  + 483202.0175233 * T - 0.0036539 * T * T);
  const [mr, m1r, dr, fr] = [Ms, Mm, Dv, Fv].map(x => x * Math.PI / 180);
  const dL  = 6.288774 * Math.sin(m1r)
    + 1.274027 * Math.sin(2 * dr - m1r)
    + 0.658314 * Math.sin(2 * dr)
    + 0.213618 * Math.sin(2 * m1r)
    - 0.185116 * Math.sin(mr)
    - 0.114332 * Math.sin(2 * fr)
    + 0.058793 * Math.sin(2 * dr - 2 * m1r)
    + 0.057066 * Math.sin(2 * dr - mr - m1r)
    + 0.053322 * Math.sin(2 * dr + m1r)
    + 0.045758 * Math.sin(2 * dr - mr)
    - 0.040923 * Math.sin(mr - m1r)
    - 0.034720 * Math.sin(dr)
    - 0.030383 * Math.sin(mr + m1r);
  return norm360(L1 + dL);
}

/**
 * Calculate Moon's sidereal nakshatra (0-26) and rashi (0-11) from birth details.
 * @param {string} dob  - "YYYY-MM-DD"
 * @param {string} tob  - "HH:MM" (local time, 24h) — defaults to "12:00"
 * @param {number} tzOffset - timezone offset in minutes (IST = 330)
 */
function getNakshatraFromBirth(dob, tob = '12:00', tzOffset = 330) {
  const [y, mo, d] = dob.split('-').map(Number);
  const [h, m]     = (tob || '12:00').split(':').map(Number);

  // Convert local time to UTC
  const localMins  = h * 60 + m;
  const utcMins    = localMins - tzOffset;
  const utcH       = Math.floor(((utcMins % 1440) + 1440) % 1440 / 60);
  const utcM       = ((utcMins % 1440) + 1440) % 60;
  const dayOffset  = utcMins < 0 ? -1 : utcMins >= 1440 ? 1 : 0;

  const localDate  = new Date(y, mo - 1, d + dayOffset);
  const JD         = toJD(
    localDate.getFullYear(),
    localDate.getMonth() + 1,
    localDate.getDate(),
    utcH, utcM
  );

  const tropicalMoon  = moonLongitude(JD);
  const siderealMoon  = norm360(tropicalMoon - AYANAMSHA);
  const nakshatraIdx  = Math.floor(siderealMoon / (360 / 27));
  const rashiIdx      = Math.floor(siderealMoon / 30);

  return { nakshatraIdx, rashiIdx, siderealMoon };
}

// ═══════════════════════════════════════════════════════════════
// LOOKUP TABLES
// ═══════════════════════════════════════════════════════════════

/** 27 Nakshatra names (Marathi) */
const NAKSHATRA_NAMES = [
  'अश्विनी','भरणी','कृत्तिका','रोहिणी','मृगशिरा',
  'आर्द्रा','पुनर्वसु','पुष्य','अश्लेषा','मघा',
  'पूर्वा फाल्गुनी','उत्तरा फाल्गुनी','हस्त','चित्रा','स्वाती',
  'विशाखा','अनुराधा','ज्येष्ठा','मूळ','पूर्वाषाढा',
  'उत्तराषाढा','श्रवण','धनिष्ठा','शतभिषा','पूर्वाभाद्रपदा',
  'उत्तराभाद्रपदा','रेवती',
];

/** 12 Rashi names (Marathi) */
const RASHI_NAMES = [
  'मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या',
  'तुला','वृश्चिक','धनु','मकर','कुंभ','मीन',
];

// ── 1. Varna — Rashi → Varna (0=Shudra,1=Vaishya,2=Kshatriya,3=Brahmin)
//   Fire signs (Aries,Leo,Sag) → Kshatriya
//   Earth signs (Tau,Vir,Cap)  → Vaishya
//   Air signs  (Gem,Lib,Aqu)   → Shudra
//   Water signs(Can,Sco,Pis)   → Brahmin
const VARNA = [2,1,0,3,2,1,0,3,2,1,0,3]; // index = rashi (0-11)
const VARNA_NAMES = ['शूद्र','वैश्य','क्षत्रिय','ब्राह्मण'];

// ── 2. Vashya — Rashi → group (0=Manav,1=Chatushpad,2=Jalchar,3=Vanchar,4=Keeta)
const VASHYA = [1,1,0,2,3,0,0,4,0,1,0,2];
const VASHYA_NAMES = ['मानव','चतुष्पाद','जलचर','वानचर','कीट'];
// Compatibility matrix [boy_group][girl_group]
const VASHYA_MATRIX = [
  [2,1,1,0,0], // Manav
  [1,2,0,1,0], // Chatushpad
  [1,0,2,0,1], // Jalchar
  [0,1,0,2,0], // Vanchar
  [0,0,1,0,2], // Keeta
];

// ── 3. Tara — bad taras: Vipat(3),Pratyak(5),Vadha(7) [1-indexed]
const TARA_NAMES = ['','जन्म','संपत','विपत','क्षेम','प्रत्यक','साधन','वध','मित्र','परम मित्र'];

// ── 4. Yoni — Nakshatra → animal index (0-13)
const YONI_IDX = [
  0,1,2,3,3,4,5,2,5,6,6,7,8,9,8,9,10,10,4,11,12,11,13,0,13,7,1,
];
//            0      1       2     3      4    5    6    7    8      9      10    11     12       13
const YONI_NAMES = ['अश्व','हस्ती','मेष','सर्प','कुत्रा','मार्जार','मूषक','गाय','महिष','व्याघ्र','मृग','वानर','नकुल','सिंह'];
// Enemy pairs [a, b] — 0 pts each
const YONI_ENEMY = [[0,8],[1,13],[2,9],[3,12],[4,10],[5,6],[7,11]];

// ── 5. Graha Maitri — Rashi → lord planet index (0=Sun..6=Saturn)
const RASHI_LORD = [2,5,3,1,0,3,5,2,4,6,6,4];
//  Aries=Mars(2), Taurus=Venus(5), Gemini=Mercury(3), Cancer=Moon(1),
//  Leo=Sun(0), Virgo=Mercury(3), Libra=Venus(5), Scorpio=Mars(2),
//  Sagit=Jupiter(4), Capricorn=Saturn(6), Aquarius=Saturn(6), Pisces=Jupiter(4)
const PLANET_NAMES = ['सूर्य','चंद्र','मंगळ','बुध','गुरु','शुक्र','शनि'];
// Friendship matrix [planet_a][planet_b]: 0=Enemy,1=Neutral,2=Friend
const PLANET_FRIEND = [
  [0,2,2,1,2,0,0], // Sun
  [2,0,1,2,1,1,1], // Moon
  [2,2,0,0,2,1,1], // Mars
  [1,0,0,0,1,2,1], // Mercury
  [2,2,2,0,0,0,1], // Jupiter
  [0,0,1,2,1,0,2], // Venus
  [0,0,0,2,1,2,0], // Saturn
];

// ── 6. Gana — Nakshatra → Gana (0=Deva,1=Manav,2=Rakshasa)
const GANA = [0,1,2,1,0,1,0,0,2,2,1,0,0,2,0,2,0,2,2,1,1,0,2,0,1,0,0];
const GANA_NAMES = ['देव','मानव','राक्षस'];
// Score matrix [boy_gana][girl_gana]
const GANA_MATRIX = [[6,5,1],[5,6,0],[0,0,6]];

// ── 7. Bhakoot — based on relative Rashi positions (bad: 2-12, 6-8)
// Score: 7 if good, 0 if bad

// ── 8. Nadi — Nakshatra → Nadi (0=Aadi,1=Madhya,2=Antya)
const NADI = [0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2];
const NADI_NAMES = ['आदि','मध्य','अंत्य'];
// Same Nadi = Nadi Dosha = 0 points; different = 8 points

// ═══════════════════════════════════════════════════════════════
// INDIVIDUAL KOOTA CALCULATORS
// ═══════════════════════════════════════════════════════════════

function calcVarna(brideRashi, groomRashi) {
  const bv = VARNA[brideRashi], gv = VARNA[groomRashi];
  const score = gv >= bv ? 1 : 0;
  return {
    score, max: 1,
    note: `वधू: ${VARNA_NAMES[bv]}, वर: ${VARNA_NAMES[gv]}`,
    status: score === 1 ? 'good' : 'bad',
  };
}

function calcVashya(brideRashi, groomRashi) {
  const bg = VASHYA[brideRashi], gg = VASHYA[groomRashi];
  const score = VASHYA_MATRIX[gg][bg]; // boy controls girl = good
  return {
    score, max: 2,
    note: `वधू: ${VASHYA_NAMES[bg]}, वर: ${VASHYA_NAMES[gg]}`,
    status: score === 2 ? 'good' : score === 1 ? 'average' : 'bad',
  };
}

function calcTara(brideNak, groomNak) {
  // Count from bride → groom and groom → bride
  const t1 = ((groomNak - brideNak + 27) % 27) % 9 + 1; // 1-9
  const t2 = ((brideNak - groomNak + 27) % 27) % 9 + 1;
  const BAD = new Set([3, 5, 7]); // Vipat, Pratyak, Vadha
  const b1 = BAD.has(t1), b2 = BAD.has(t2);
  const score = (!b1 && !b2) ? 3 : (!b1 || !b2) ? 1.5 : 0;
  return {
    score, max: 3,
    note: `वधू→वर: ${TARA_NAMES[t1]} (${t1}), वर→वधू: ${TARA_NAMES[t2]} (${t2})`,
    status: score === 3 ? 'good' : score > 0 ? 'average' : 'bad',
    t1, t2,
  };
}

function calcYoni(brideNak, groomNak) {
  const by = YONI_IDX[brideNak], gy = YONI_IDX[groomNak];
  let score;
  if (by === gy) {
    score = 4;
  } else {
    const isEnemy = YONI_ENEMY.some(([a, b]) =>
      (by === a && gy === b) || (by === b && gy === a)
    );
    score = isEnemy ? 0 : 2;
  }
  return {
    score, max: 4,
    note: `वधू: ${YONI_NAMES[by]}, वर: ${YONI_NAMES[gy]}`,
    status: score >= 3 ? 'good' : score >= 2 ? 'average' : 'bad',
  };
}

function calcGrahaMaitri(brideRashi, groomRashi) {
  const bp = RASHI_LORD[brideRashi], gp = RASHI_LORD[groomRashi];
  if (bp === gp) {
    return { score: 5, max: 5, note: `दोन्ही: ${PLANET_NAMES[bp]}`, status: 'good' };
  }
  const f12 = PLANET_FRIEND[bp][gp];
  const f21 = PLANET_FRIEND[gp][bp];
  const total = f12 + f21; // 0-4
  const scoreMap = [0, 1, 3, 4, 5];
  const score = scoreMap[Math.min(total, 4)];
  const rel = total >= 3 ? 'मित्र' : total >= 2 ? 'तटस्थ' : 'शत्रु';
  return {
    score, max: 5,
    note: `वधू ग्रह: ${PLANET_NAMES[bp]}, वर ग्रह: ${PLANET_NAMES[gp]} (${rel})`,
    status: score >= 4 ? 'good' : score >= 3 ? 'average' : 'bad',
  };
}

function calcGana(brideNak, groomNak) {
  const bg = GANA[brideNak], gg = GANA[groomNak];
  const score = GANA_MATRIX[gg][bg];
  return {
    score, max: 6,
    note: `वधू: ${GANA_NAMES[bg]}, वर: ${GANA_NAMES[gg]}`,
    status: score >= 5 ? 'good' : score >= 3 ? 'average' : 'bad',
  };
}

function calcBhakoot(brideRashi, groomRashi) {
  const diff1 = ((groomRashi - brideRashi + 12) % 12) + 1;  // boy from girl
  const diff2 = ((brideRashi - groomRashi + 12) % 12) + 1;  // girl from boy
  const BAD   = new Set([2, 12, 6, 8]);
  const isBad = BAD.has(diff1) || BAD.has(diff2);
  const score = isBad ? 0 : 7;
  return {
    score, max: 7,
    note: `राशी भेद: ${diff1}/${diff2}${isBad ? ' (षडाष्टक/द्विद्वादश दोष)' : ''}`,
    status: score === 7 ? 'good' : 'bad',
  };
}

function calcNadi(brideNak, groomNak) {
  const bn = NADI[brideNak], gn = NADI[groomNak];
  const isSame = bn === gn;
  const score = isSame ? 0 : 8;
  return {
    score, max: 8,
    note: `वधू: ${NADI_NAMES[bn]}, वर: ${NADI_NAMES[gn]}${isSame ? ' (नाडी दोष!)' : ''}`,
    status: score === 8 ? 'good' : 'bad',
  };
}

// ═══════════════════════════════════════════════════════════════
// MASTER MATCH FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate Ashta Koota Gun Milan
 * @param {{ nakshatraIdx, rashiIdx }} bride
 * @param {{ nakshatraIdx, rashiIdx }} groom
 * @returns {{ totalGun, maxGun, percent, result, grade, kootas[], recommendation }}
 */
function calculateGunMilan(bride, groom) {
  const bN = bride.nakshatraIdx, bR = bride.rashiIdx;
  const gN = groom.nakshatraIdx, gR = groom.rashiIdx;

  const kootas = [
    { name: 'वर्ण',        nameEn: 'Varna',        ...calcVarna(bR, gR)        },
    { name: 'वश्य',        nameEn: 'Vashya',       ...calcVashya(bR, gR)       },
    { name: 'तारा',        nameEn: 'Tara',         ...calcTara(bN, gN)         },
    { name: 'योनी',        nameEn: 'Yoni',         ...calcYoni(bN, gN)         },
    { name: 'ग्रह मैत्री', nameEn: 'Graha Maitri', ...calcGrahaMaitri(bR, gR)  },
    { name: 'गण',          nameEn: 'Gana',         ...calcGana(bN, gN)         },
    { name: 'भकूट',       nameEn: 'Bhakoot',      ...calcBhakoot(bR, gR)      },
    { name: 'नाडी',        nameEn: 'Nadi',         ...calcNadi(bN, gN)         },
  ];

  const totalGun = kootas.reduce((s, k) => s + k.score, 0);
  const maxGun   = 36;
  const percent  = Math.round((totalGun / maxGun) * 100);

  // Check for major doshas
  const doshas = [];
  if (kootas[7].score === 0) doshas.push('नाडी दोष'); // Nadi same
  if (kootas[6].score === 0) doshas.push('भकूट दोष'); // Bhakoot bad
  if (kootas[5].score === 0) doshas.push('गण दोष');   // Gana incompatible

  let result, grade, recommendation;
  if (totalGun >= 32) {
    result = 'अत्युत्तम जुळणी'; grade = 'A+';
    recommendation = 'हे जोडपे अत्यंत सुयोग्य आहे. विवाह अवश्य करावा.';
  } else if (totalGun >= 27) {
    result = 'उत्तम जुळणी';     grade = 'A';
    recommendation = 'चांगली जुळणी आहे. विवाह शुभ मानला जातो.';
  } else if (totalGun >= 21) {
    result = 'साधारण जुळणी';    grade = 'B';
    recommendation = 'मध्यम जुळणी. पुजारींचा सल्ला घेऊन पुढे जावे.';
  } else if (totalGun >= 18) {
    result = 'कमी जुळणी';       grade = 'C';
    recommendation = 'जुळणी कमी आहे. तज्ञ ज्योतिषाचा सल्ला आवश्यक.';
  } else {
    result = 'अयोग्य जुळणी';    grade = 'D';
    recommendation = 'गुण जुळणी अपुरी आहे. विवाह टाळावा अथवा दोष शांती करावी.';
  }

  if (doshas.length > 0) {
    recommendation += ` ⚠️ ${doshas.join(', ')} आढळला — उपाय करणे आवश्यक.`;
  }

  return { totalGun, maxGun, percent, result, grade, kootas, doshas, recommendation };
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Full pipeline: birth details → natal positions → Gun Milan result
 */
function matchKundali(brideDetails, groomDetails) {
  const bride = getNakshatraFromBirth(brideDetails.dob, brideDetails.tob, brideDetails.tzOffset || 330);
  const groom = getNakshatraFromBirth(groomDetails.dob, groomDetails.tob, groomDetails.tzOffset || 330);

  const match = calculateGunMilan(bride, groom);

  return {
    bride: {
      ...brideDetails,
      nakshatraIdx: bride.nakshatraIdx,
      rashiIdx:     bride.rashiIdx,
      nakshatra:    NAKSHATRA_NAMES[bride.nakshatraIdx],
      rashi:        RASHI_NAMES[bride.rashiIdx],
    },
    groom: {
      ...groomDetails,
      nakshatraIdx: groom.nakshatraIdx,
      rashiIdx:     groom.rashiIdx,
      nakshatra:    NAKSHATRA_NAMES[groom.nakshatraIdx],
      rashi:        RASHI_NAMES[groom.rashiIdx],
    },
    ...match,
  };
}

module.exports = {
  matchKundali,
  getNakshatraFromBirth,
  NAKSHATRA_NAMES,
  RASHI_NAMES,
};
