// src/utils/sunTimes.js — sunrise / sunset (NOAA solar position algorithm)
//
// Sunrise/sunset = upper limb of the Sun on the horizon with standard refraction
// (zenith 90.833°), the convention used by USNO, timeanddate and printed panchangs.
// Checked against PyEphem (USNO settings) for Pune, Mumbai and Nagpur: agrees to
// within a few seconds. SunCalc, used before, ran 1–2 minutes late.

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

// Declination (deg) and equation of time (minutes) at a Julian Day.
function solarParams(jd) {
  const T = (jd - 2451545) / 36525;
  const L0 = (((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360) + 360) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T))
          + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T)
          + Math.sin(rad(3 * M)) * 0.000289;
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(rad(omega));
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(rad(omega));
  const dec = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda))));
  const y = Math.tan(rad(eps / 2)) ** 2;
  const eqTime = 4 * deg(
    y * Math.sin(2 * rad(L0))
    - 2 * e * Math.sin(rad(M))
    + 4 * e * y * Math.sin(rad(M)) * Math.cos(2 * rad(L0))
    - 0.5 * y * y * Math.sin(4 * rad(L0))
    - 1.25 * e * e * Math.sin(2 * rad(M)),
  );
  return { dec, eqTime };
}

// Time of sunrise (rising=true) or sunset on the civil date y-mo-d at lat/lon.
// Returns a Date, or null when the Sun does not rise/set that day (polar regions).
function sunEvent(y, mo, d, lat, lon, rising) {
  const midnightUTC = Date.UTC(y, mo - 1, d);
  // first guess: 06:00 / 18:00 local mean solar time
  let utcMin = (rising ? 360 : 1080) - 4 * lon;
  for (let i = 0; i < 4; i++) {
    const jd = (midnightUTC + utcMin * 60000) / 86400000 + 2440587.5;
    const { dec, eqTime } = solarParams(jd);
    const cosH = Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(rad(dec)))
               - Math.tan(rad(lat)) * Math.tan(rad(dec));
    if (cosH < -1 || cosH > 1) return null;
    const ha = deg(Math.acos(cosH));
    utcMin = 720 - 4 * (lon + (rising ? ha : -ha)) - eqTime;
  }
  return new Date(midnightUTC + utcMin * 60000);
}

// Sunrise and sunset for the civil date y-mo-d at lat/lon. Valid for locations where
// local time is within about ±12 h of the Sun's (all of India).
function getSunTimes(y, mo, d, lat, lon) {
  return { sunrise: sunEvent(y, mo, d, lat, lon, true), sunset: sunEvent(y, mo, d, lat, lon, false) };
}

module.exports = { getSunTimes };
