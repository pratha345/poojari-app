// src/services/gocharService.js — गोचर (planetary transits) for rashifal
//
// Sidereal (Lahiri) longitudes from astronomy-engine (true ecliptic of date, apparent
// positions), rashi-change times found by scanning + bisection to under a minute, and the
// classical gochar results counted from the Moon sign (चंद्र राशी), as used for rashibhavishya.
// Rahu/Ketu use the mean node, as most Marathi panchangs do.

const Astro = require('astronomy-engine');

const RASHIS = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'];

const PLANETS = {
  Sun:     { mr: 'सूर्य',  body: 'Sun' },
  Moon:    { mr: 'चंद्र',  body: 'Moon' },
  Mars:    { mr: 'मंगळ',   body: 'Mars' },
  Mercury: { mr: 'बुध',    body: 'Mercury' },
  Jupiter: { mr: 'गुरू',   body: 'Jupiter' },
  Venus:   { mr: 'शुक्र',  body: 'Venus' },
  Saturn:  { mr: 'शनी',    body: 'Saturn' },
  Rahu:    { mr: 'राहू' },
  Ketu:    { mr: 'केतू' },
};

// Houses from the Moon sign in which a transiting planet gives good results
// (Phaladeepika ch. 26 / Muhurta Chintamani gochar rules; vedha not applied).
const GOOD_HOUSES = {
  Sun:     [3, 6, 10, 11],
  Moon:    [1, 3, 6, 7, 10, 11],
  Mars:    [3, 6, 11],
  Mercury: [2, 4, 6, 8, 10, 11],
  Jupiter: [2, 5, 7, 9, 11],
  Venus:   [1, 2, 3, 4, 5, 8, 9, 11, 12],
  Saturn:  [3, 6, 11],
  Rahu:    [3, 6, 11],
  Ketu:    [3, 6, 11],
};

const norm360 = (d) => ((d % 360) + 360) % 360;

// Lahiri (Chitrapaksha) ayanamsha as defined by the Indian Calendar Reform Committee:
// 23°15'00.658" on 1956-03-21 0h TT (JD 2435553.5), general precession 50.2788"/year,
// plus nutation in longitude so it pairs with true-of-date ecliptic longitudes.
const LAHIRI_1956 = 23 + 15 / 60 + 0.658 / 3600;
const TT_1956 = 2435553.5 - 2451545.0;
function lahiri(t) {
  const years = (t.tt - TT_1956) / 365.25;
  return LAHIRI_1956 + (years * 50.2788) / 3600 + Astro.e_tilt(t).dpsi / 3600;
}

function tropicalLon(key, t) {
  if (key === 'Moon') return Astro.EclipticGeoMoon(t).lon;
  if (key === 'Rahu' || key === 'Ketu') {
    const T = t.tt / 36525;
    const node = norm360(125.0445479 - 1934.1362608 * T + 0.0020754 * T * T + (T * T * T) / 467441);
    return key === 'Rahu' ? node : norm360(node + 180);
  }
  return Astro.Ecliptic(Astro.GeoVector(PLANETS[key].body, t, true)).elon;
}

function siderealLon(key, date) {
  const t = Astro.MakeTime(date);
  return norm360(tropicalLon(key, t) - lahiri(t));
}

const rashiIdx = (key, date) => Math.floor(siderealLon(key, date) / 30);

// daily motion in degrees (negative = वक्री)
function speed(key, date) {
  const a = siderealLon(key, new Date(date.getTime() - 43200000));
  const b = siderealLon(key, new Date(date.getTime() + 43200000));
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

// scan step per planet: must be shorter than the shortest stay in one rashi
const STEP_H = { Moon: 2, Sun: 12, Mercury: 6, Venus: 12, Mars: 12, Jupiter: 24, Saturn: 24, Rahu: 24, Ketu: 24 };

// Every rashi change of `key` between start and end (Dates). Returns [{at, from, to, retro}]
function ingresses(key, start, end) {
  const step = STEP_H[key] * 3600000;
  const out = [];
  let prevT = start.getTime();
  let prevR = rashiIdx(key, start);
  for (let ms = prevT + step; ms <= end.getTime() + step; ms += step) {
    const r = rashiIdx(key, new Date(ms));
    if (r !== prevR) {
      let lo = prevT, hi = ms;
      while (hi - lo > 30000) {
        const mid = (lo + hi) / 2;
        if (rashiIdx(key, new Date(mid)) === prevR) lo = mid; else hi = mid;
      }
      const at = new Date(Math.round(hi / 60000) * 60000);
      if (at >= start && at <= end) out.push({ at, from: prevR, to: r, retro: speed(key, at) < 0 });
      prevR = r;
    }
    prevT = ms;
  }
  return out;
}

// वक्री / मार्गी stations (planets other than Sun, Moon, Rahu, Ketu)
function stations(key, start, end) {
  const out = [];
  const day = 86400000;
  let prev = speed(key, start);
  for (let ms = start.getTime() + day; ms <= end.getTime(); ms += day) {
    const s = speed(key, new Date(ms));
    if (Math.sign(s) !== Math.sign(prev)) {
      let lo = ms - day, hi = ms;
      while (hi - lo > 600000) {
        const mid = (lo + hi) / 2;
        if (Math.sign(speed(key, new Date(mid))) === Math.sign(prev)) lo = mid; else hi = mid;
      }
      out.push({ at: new Date(hi), kind: s < 0 ? 'वक्री' : 'मार्गी', rashi: rashiIdx(key, new Date(hi)) });
    }
    prev = s;
  }
  return out;
}

// house (1-12) of a planet in rashi `planetRashi`, counted from Moon sign `moonSign`
const houseFrom = (moonSign, planetRashi) => ((planetRashi - moonSign + 12) % 12) + 1;
const isGood = (key, house) => GOOD_HOUSES[key].includes(house);

// साडेसाती / अडीचकी status of Saturn for a Moon sign
function shaniStatus(moonSign, saturnRashi) {
  const h = houseFrom(moonSign, saturnRashi);
  if (h === 12) return 'साडेसातीचा पहिला टप्पा';
  if (h === 1)  return 'साडेसातीचा दुसरा (मधला) टप्पा';
  if (h === 2)  return 'साडेसातीचा तिसरा (शेवटचा) टप्पा';
  if (h === 4)  return 'अडीचकी (चतुर्थ शनी)';
  if (h === 8)  return 'अडीचकी (अष्टम शनी)';
  return '';
}

// Positions of all planets at an instant, with house + result for one Moon sign (optional)
function positions(date, moonSign = null) {
  return Object.keys(PLANETS).map((key) => {
    const lon = siderealLon(key, date);
    const r = Math.floor(lon / 30);
    const row = { key, mr: PLANETS[key].mr, rashi: r, rashiMr: RASHIS[r], deg: +(lon % 30).toFixed(2),
                  retro: !['Sun', 'Moon', 'Rahu', 'Ketu'].includes(key) && speed(key, date) < 0 };
    if (moonSign !== null) { row.house = houseFrom(moonSign, r); row.good = isGood(key, row.house); }
    return row;
  });
}

module.exports = {
  RASHIS, PLANETS, GOOD_HOUSES,
  siderealLon, rashiIdx, speed, ingresses, stations, positions, houseFrom, isGood, shaniStatus,
};
