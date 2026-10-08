// Rahu kaal / yamaganda / gulika must fall in the traditional eighth of the day for
// every weekday, and sunrise must match the USNO/NOAA standard (checked against PyEphem).
const { getPanchang } = require('../src/services/panchangService');

const PUNE = [18.5204, 73.8567];
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
// eighth of the day (0-7) that a range starts in
const eighth = (p, r) => Math.round((toMin(r.start) - toMin(p.sunrise)) / ((toMin(p.sunset) - toMin(p.sunrise)) / 8));

// 2026-10-04 is a Sunday; index = weekday
const DATES = ['2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10'];
const RAHU      = [7, 1, 6, 4, 5, 3, 2];
const YAMAGANDA = [4, 3, 2, 1, 0, 6, 5];
const GULIKA    = [6, 5, 4, 3, 2, 1, 0];

describe('muhurta segments per weekday', () => {
  DATES.forEach((date, wd) => {
    it(`${date} (weekday ${wd})`, async () => {
      const p = await getPanchang(date, ...PUNE, 330);
      expect(eighth(p, p.rahuKaal)).toBe(RAHU[wd]);
      expect(eighth(p, p.yamaganda)).toBe(YAMAGANDA[wd]);
      expect(eighth(p, p.gulikaKaal)).toBe(GULIKA[wd]);
      expect(p.abhijitMuhurat.avoid).toBe(wd === 3);
    });
  });
});

describe('sunrise / sunset accuracy', () => {
  it('Pune 2026-10-08 matches USNO (06:26:32 / 18:17:33)', async () => {
    const p = await getPanchang('2026-10-08', ...PUNE, 330);
    expect(Math.abs(Date.parse(p.sunriseAt) - Date.parse('2026-10-08T00:56:32Z'))).toBeLessThan(5000);
    expect(Math.abs(Date.parse(p.sunsetAt) - Date.parse('2026-10-08T12:47:33Z'))).toBeLessThan(5000);
    expect(p.sunrise).toBe('06:27');
    expect(p.sunset).toBe('18:18');
  });
});
